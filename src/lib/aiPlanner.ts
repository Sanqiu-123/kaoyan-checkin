import { AppState, Subject } from "@/types/study";

export interface AiTaskDraft {
  time: string;
  subject: Subject;
  title: string;
  plannedMinutes: number;
  reason?: string;
}

export interface AiPlanResult {
  model: string;
  summary: string;
  strategy: string[];
  tasks: AiTaskDraft[];
  warnings: string[];
}

function buildPlanningPayload(state: AppState) {
  const recentRecords = Object.entries(state.records)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8);

  return {
    progress: state.progress,
    settings: {
      targetDate: state.settings.targetDate,
      dailyStudyHours: state.settings.dailyStudyHours
    },
    records: Object.fromEntries(recentRecords),
    weakPoints: state.weakPoints.filter((item) => item.status !== "已掌握").slice(0, 20),
    adjustmentLogs: state.adjustmentLogs.slice(0, 10)
  };
}

export async function requestDeepSeekPlan(
  state: AppState,
  today: string,
  userGoal: string,
  accessCode?: string
): Promise<AiPlanResult> {
  const response = await fetch("/api/ai-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessCode ? { "x-ai-access-code": accessCode } : {})
    },
    body: JSON.stringify({
      state: buildPlanningPayload(state),
      today,
      userGoal
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? "DeepSeek 规划失败。");
  }

  return body as AiPlanResult;
}
