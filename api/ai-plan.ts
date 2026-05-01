const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-pro";

type AiTaskSubject = "math" | "cs408" | "english" | "review";

interface AiTaskDraft {
  time: string;
  subject: AiTaskSubject;
  title: string;
  plannedMinutes: number;
  reason?: string;
}

interface AiPlanResult {
  model: string;
  summary: string;
  strategy: string[];
  tasks: AiTaskDraft[];
  warnings: string[];
}

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.status(statusCode).json(payload);
}

function pickLatestDeepSeekModel(modelIds: string[]) {
  const scored = modelIds
    .map((id) => {
      const version = Number(id.match(/deepseek-v(\d+)/)?.[1] ?? 0);
      const tier = id.includes("pro") ? 3 : id.includes("flash") ? 2 : 1;
      return { id, version, tier };
    })
    .filter((item) => item.id.startsWith("deepseek-"))
    .sort((a, b) => b.version - a.version || b.tier - a.tier || a.id.localeCompare(b.id));

  return scored[0]?.id ?? DEFAULT_MODEL;
}

async function resolveModel(apiKey: string) {
  const configured = process.env.DEEPSEEK_MODEL?.trim();
  if (configured) return configured;
  if (process.env.DEEPSEEK_AUTO_MODEL !== "true") return DEFAULT_MODEL;

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!response.ok) return DEFAULT_MODEL;
    const body = (await response.json()) as { data?: Array<{ id?: string }> };
    return pickLatestDeepSeekModel((body.data ?? []).map((item) => item.id ?? "").filter(Boolean));
  } catch {
    return DEFAULT_MODEL;
  }
}

function safeStringify(value: unknown) {
  return JSON.stringify(value, null, 2).slice(0, 18000);
}

function extractJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("DeepSeek 返回内容不是 JSON。");
    return JSON.parse(match[0]);
  }
}

function normalizePlan(raw: any, model: string): AiPlanResult {
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  return {
    model,
    summary: String(raw.summary ?? "DeepSeek 已生成学习规划。").slice(0, 400),
    strategy: (Array.isArray(raw.strategy) ? raw.strategy : [])
      .map((item: unknown) => String(item).slice(0, 180))
      .filter(Boolean)
      .slice(0, 6),
    tasks: tasks
      .map((task: any): AiTaskDraft => {
        const subject = ["math", "cs408", "english", "review"].includes(task.subject) ? task.subject : "review";
        return {
          time: String(task.time ?? "自定义").slice(0, 20),
          subject,
          title: String(task.title ?? "AI 规划学习任务").slice(0, 80),
          plannedMinutes: Math.max(5, Math.min(240, Number(task.plannedMinutes) || 30)),
          reason: task.reason ? String(task.reason).slice(0, 160) : undefined
        };
      })
      .filter((task: AiTaskDraft) => task.title.trim())
      .slice(0, 8),
    warnings: (Array.isArray(raw.warnings) ? raw.warnings : [])
      .map((item: unknown) => String(item).slice(0, 160))
      .filter(Boolean)
      .slice(0, 4)
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "只支持 POST 请求。" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(res, 501, { error: "尚未配置 DEEPSEEK_API_KEY，DeepSeek 规划暂不可用。" });
    return;
  }

  const accessCode = process.env.AI_ACCESS_CODE?.trim();
  if (accessCode && req.headers["x-ai-access-code"] !== accessCode) {
    sendJson(res, 401, { error: "AI 访问口令不正确。请在网页中输入 Vercel 环境变量 AI_ACCESS_CODE 对应的口令。" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const userGoal = String(body?.userGoal ?? "").trim();
    if (!userGoal) {
      sendJson(res, 400, { error: "请先输入你想让 DeepSeek 规划的学习目标或限制。" });
      return;
    }

    const model = await resolveModel(apiKey);
    const context = {
      userGoal,
      today: body?.today,
      progress: body?.state?.progress,
      todayRecord: body?.state?.records?.[body?.today],
      recentRecords: Object.values(body?.state?.records ?? {}).slice(-8),
      weakPoints: (body?.state?.weakPoints ?? []).slice(0, 20),
      targetDate: body?.state?.settings?.targetDate
    };

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "你是人工智能专业考研学习规划助手。请只输出 JSON，不要 Markdown。输出字段必须是 summary、strategy、tasks、warnings。tasks 每项包含 time、subject、title、plannedMinutes、reason。subject 只能是 math、cs408、english、review。任务必须具体到教材章节、练习闭环和补弱点，避免空泛鼓励。"
          },
          {
            role: "user",
            content: `请根据以下本地学习进度和用户的新需求，生成今天可以加入打卡系统的学习规划：\n${safeStringify(context)}`
          }
        ]
      })
    });

    const responseBody = await response.json();
    if (!response.ok) {
      sendJson(res, response.status, {
        error: responseBody?.error?.message ?? "DeepSeek 调用失败。"
      });
      return;
    }

    const content = responseBody?.choices?.[0]?.message?.content;
    if (!content) {
      sendJson(res, 502, { error: "DeepSeek 没有返回可用内容。" });
      return;
    }

    sendJson(res, 200, normalizePlan(extractJson(content), model));
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "DeepSeek 规划失败。"
    });
  }
}
