import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { AppState } from "@/types/study";
import { normalizeState } from "@/lib/studyData";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const hasCloudConfig = Boolean(supabaseUrl && supabaseAnonKey);

function getClient() {
  if (!hasCloudConfig) {
    throw new Error("尚未配置 Supabase。请在 .env.local 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。");
  }
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}

async function requireUser() {
  const supabase = getClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("请先登录 Supabase 账号。");
  return data.user;
}

function cloudSafeState(state: AppState): AppState {
  return {
    ...state,
    cloudSync: {
      ...state.cloudSync,
      lastError: undefined
    }
  };
}

export async function getCloudUser(): Promise<User | null> {
  if (!hasCloudConfig) return null;
  const { data, error } = await getClient().auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signUpCloud(email: string, password: string) {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signInCloud(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutCloud() {
  if (!hasCloudConfig) return;
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

export async function pushStateToCloud(state: AppState) {
  const supabase = getClient();
  const user = await requireUser();
  const syncedAt = new Date().toISOString();
  const { error } = await supabase.from("study_snapshots").upsert(
    {
      user_id: user.id,
      state: cloudSafeState({
        ...state,
        cloudSync: {
          ...state.cloudSync,
          lastSyncedAt: syncedAt,
          lastError: undefined
        }
      }),
      updated_at: syncedAt
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
  return syncedAt;
}

export async function pullStateFromCloud() {
  const supabase = getClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from("study_snapshots")
    .select("state, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.state) return null;

  return {
    state: normalizeState(data.state as Partial<AppState>),
    updatedAt: String(data.updated_at ?? "")
  };
}
