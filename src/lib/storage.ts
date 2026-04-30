import { AppState } from "@/types/study";
import { createInitialState, normalizeState, STORAGE_KEY } from "@/lib/studyData";

const DB_NAME = "ai-kaoyan-checkin-db";
const DB_VERSION = 1;
const STORE_NAME = "app-state";
const STATE_ID = "current";

function openStudyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("当前浏览器不支持 IndexedDB"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("打开 IndexedDB 失败"));
  });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB 操作失败"));
  });
}

async function loadFromIndexedDb() {
  const db = await openStudyDb();
  try {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const result = await promisifyRequest<AppState | undefined>(store.get(STATE_ID));
    return result ? normalizeState(result) : null;
  } finally {
    db.close();
  }
}

async function saveToIndexedDb(state: AppState) {
  const db = await openStudyDb();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await promisifyRequest(store.put(state, STATE_ID));
  } finally {
    db.close();
  }
}

async function deleteFromIndexedDb() {
  const db = await openStudyDb();
  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await promisifyRequest(store.delete(STATE_ID));
  } finally {
    db.close();
  }
}

function loadLegacyLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return null;
  }
}

export async function loadPersistedState(): Promise<AppState> {
  try {
    const indexedState = await loadFromIndexedDb();
    if (indexedState) return indexedState;

    const legacyState = loadLegacyLocalStorage();
    if (legacyState) {
      await saveToIndexedDb(legacyState);
      localStorage.setItem(`${STORAGE_KEY}-migrated-at`, new Date().toISOString());
      return legacyState;
    }
  } catch {
    const legacyState = loadLegacyLocalStorage();
    if (legacyState) return legacyState;
  }

  return createInitialState();
}

export async function savePersistedState(state: AppState) {
  try {
    await saveToIndexedDb(state);
    localStorage.setItem(
      `${STORAGE_KEY}-metadata`,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        records: Object.keys(state.records).length,
        storage: "indexedDB"
      })
    );
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export async function deletePersistedState() {
  try {
    await deleteFromIndexedDb();
  } catch {
    // localStorage cleanup below is still useful when IndexedDB is unavailable.
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}-metadata`);
  localStorage.removeItem(`${STORAGE_KEY}-migrated-at`);
}

export function serializeBackup(state: AppState) {
  return JSON.stringify(
    {
      app: "ai-kaoyan-checkin",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      state
    },
    null,
    2
  );
}

export function parseBackup(text: string) {
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("备份文件格式不正确");
  }
  const payload = parsed as Partial<AppState> & { state?: Partial<AppState> };
  const candidate = payload.state ?? payload;
  return normalizeState(candidate);
}
