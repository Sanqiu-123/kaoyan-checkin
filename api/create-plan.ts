const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-pro";

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
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!response.ok) return DEFAULT_MODEL;
    const body = (await response.json()) as { data?: Array<{ id?: string }> };
    return pickLatestDeepSeekModel((body.data ?? []).map((item) => item.id ?? "").filter(Boolean));
  } catch {
    return DEFAULT_MODEL;
  }
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

function normalizePlan(raw: any, fallbackTargetDate: string) {
  const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
  const units = Array.isArray(raw.units) ? raw.units : [];
  return {
    title: String(raw.title ?? "新的学习规划").slice(0, 40),
    goal: String(raw.goal ?? "完成新的学习目标").slice(0, 400),
    targetDate: String(raw.targetDate ?? fallbackTargetDate),
    subjects: subjects
      .map((subject: any) => ({
        name: String(subject.name ?? "综合").slice(0, 20),
        color: subject.color ? String(subject.color).slice(0, 20) : undefined
      }))
      .filter((subject: any) => subject.name)
      .slice(0, 8),
    units: units
      .map((unit: any) => ({
        subjectName: String(unit.subjectName ?? subjects[0]?.name ?? "综合").slice(0, 20),
        title: String(unit.title ?? "学习单元").slice(0, 60),
        resource: String(unit.resource ?? "自定义资料").slice(0, 80),
        focus: String(unit.focus ?? "完成核心内容").slice(0, 160),
        practice: String(unit.practice ?? "完成配套练习并复盘").slice(0, 160),
        estimatedDays: Math.max(1, Math.min(14, Number(unit.estimatedDays) || 1))
      }))
      .filter((unit: any) => unit.title)
      .slice(0, 80),
    strategy: (Array.isArray(raw.strategy) ? raw.strategy : [])
      .map((item: unknown) => String(item).slice(0, 160))
      .filter(Boolean)
      .slice(0, 8)
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "只支持 POST 请求。" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    sendJson(res, 501, { error: "尚未配置 DEEPSEEK_API_KEY，无法创建 AI 规划。" });
    return;
  }

  const accessCode = process.env.AI_ACCESS_CODE?.trim();
  if (accessCode && req.headers["x-ai-access-code"] !== accessCode) {
    sendJson(res, 401, { error: "AI 访问口令不正确。" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const description = String(body?.description ?? "").trim();
    const targetDate = String(body?.targetDate ?? "").trim();
    if (!description) {
      sendJson(res, 400, { error: "请描述你想创建的新规划。" });
      return;
    }

    const model = await resolveModel(apiKey);
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 2600,
        messages: [
          {
            role: "system",
            content:
              "你是学习规划系统架构师。请只输出 JSON，不要 Markdown。输出字段必须是 title、goal、targetDate、subjects、units、strategy。subjects 每项包含 name、color。units 每项包含 subjectName、title、resource、focus、practice、estimatedDays。规划要能拆成每日打卡任务，单元不要过大，优先按教材章节/模块拆分。"
          },
          {
            role: "user",
            content: `用户想创建一个独立学习打卡系统。\n目标日期：${targetDate || "用户未指定，请根据描述合理设置"}\n规划描述：${description}\n请生成可执行的完整规划蓝图。`
          }
        ]
      })
    });

    const responseBody = await response.json();
    if (!response.ok) {
      sendJson(res, response.status, { error: responseBody?.error?.message ?? "DeepSeek 创建规划失败。" });
      return;
    }

    const content = responseBody?.choices?.[0]?.message?.content;
    if (!content) {
      sendJson(res, 502, { error: "DeepSeek 没有返回可用规划。" });
      return;
    }

    sendJson(res, 200, { model, plan: normalizePlan(extractJson(content), targetDate) });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "创建规划失败。" });
  }
}

