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

function isPostgraduatePlan(description: string, raw: any) {
  const text = `${description} ${raw?.title ?? ""} ${raw?.goal ?? ""}`;
  const politicsOnly = /只.*政治|政治.*专项|政治.*专门|政治.*单科/.test(text);
  return /考研|研究生|二轮|第二轮|复试前|初试/.test(text) && !politicsOnly;
}

function inferKaoyanSubject(text: string) {
  if (/408|计算机|数据结构|操作系统|组成原理|计组|计算机网络|计网|王道/.test(text)) return "408";
  if (/英语|单词|阅读|长难句|作文|翻译|完形|新题型|真题阅读/.test(text)) return "英语一";
  if (/数学|高数|线代|概率|积分|导数|矩阵|级数|张宇|1000题/.test(text)) return "数学一";
  if (/政治|马原|毛中特|史纲|思修|肖秀荣|腿姐|徐涛/.test(text)) return "政治";
  return "";
}

function defaultKaoyanSecondRoundUnits() {
  return [
    ["数学一", "高数重点题型二轮", "张宇30讲+1000题错题", "重做极限、导数、积分、多元和级数高频题型", "错题二刷并整理方法卡片", 3],
    ["数学一", "线性代数二轮", "线代讲义+1000题", "重做矩阵、向量组、方程组、特征值和二次型", "按题型完成二刷和错因归类", 3],
    ["数学一", "概率论二轮", "概率讲义+1000题", "重做随机变量、数字特征、大数定律和统计初步", "完成对应错题并整理公式条件", 3],
    ["数学一", "数学真题与模拟衔接", "历年真题/模拟卷", "开始套卷意识，训练限时和失分分析", "每套卷复盘计算错误和题型入口", 4],
    ["408", "数据结构二轮", "王道数据结构", "回到线性表、树、图、查找排序和算法题", "补王道错题并手写关键算法", 3],
    ["408", "操作系统二轮", "王道操作系统", "重点复盘进程同步、调度、内存、文件和I/O", "完成章节错题和计算题模板", 3],
    ["408", "计算机组成原理二轮", "王道计组", "复盘数据表示、存储系统、CPU、指令和总线", "完成Cache、流水线和数据表示错题", 3],
    ["408", "计算机网络二轮", "王道计网", "复盘分层体系、链路层、网络层、传输层和应用层", "完成IP划分、TCP和协议辨析错题", 3],
    ["408", "408真题综合训练", "408历年真题", "按真题综合题训练跨章节调用", "每套题记录薄弱科目和错因", 4],
    ["英语一", "单词与长难句不断线", "单词书+田静每日一句", "保持旧词复习和长难句拆分", "每日一句翻译并记录生词", 2],
    ["英语一", "阅读真题二轮精读", "英语一历年真题", "按题型复盘阅读定位、转折和选项偷换", "精读错题文章并归纳错因", 4],
    ["英语一", "翻译、新题型、完形", "英语一真题", "补齐非阅读题型的基本流程", "每类题完成真题复盘", 3],
    ["英语一", "作文框架启动", "作文模板+真题范文", "建立大小作文素材和表达库", "每周输出并修改作文", 3],
    ["政治", "马原基础二轮", "政治核心考点", "理解哲学、政经和科社核心概念", "完成选择题并整理易混点", 2],
    ["政治", "毛中特与史纲二轮", "政治核心考点", "梳理时间线和理论体系", "完成选择题和时间轴笔记", 2],
    ["政治", "思修法基与时政", "政治核心考点", "掌握高频选择题考点", "完成选择题并归纳易错表述", 2]
  ].map(([subjectName, title, resource, focus, practice, estimatedDays]) => ({
    subjectName,
    title,
    resource,
    focus,
    practice,
    estimatedDays
  }));
}

function normalizePlan(raw: any, fallbackTargetDate: string, description: string) {
  const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
  const units = Array.isArray(raw.units) ? raw.units : [];
  const postgraduatePlan = isPostgraduatePlan(description, raw);
  const normalizedSubjects = postgraduatePlan
    ? [
        { name: "数学一", color: "#2563eb" },
        { name: "英语一", color: "#16a34a" },
        { name: "408", color: "#7c3aed" },
        { name: "政治", color: "#f97316" }
      ]
    : subjects
        .map((subject: any) => ({
          name: String(subject.name ?? "综合").slice(0, 20),
          color: subject.color ? String(subject.color).slice(0, 20) : undefined
        }))
        .filter((subject: any) => subject.name)
        .slice(0, 8);
  const normalizedUnits = units
    .map((unit: any) => {
      const rawSubject = String(unit.subjectName ?? subjects[0]?.name ?? "综合");
      const text = `${rawSubject} ${unit.title ?? ""} ${unit.resource ?? ""} ${unit.focus ?? ""} ${unit.practice ?? ""}`;
      return {
        subjectName: postgraduatePlan ? inferKaoyanSubject(text) || "数学一" : rawSubject.slice(0, 20),
        title: String(unit.title ?? "学习单元").slice(0, 60),
        resource: String(unit.resource ?? "自定义资料").slice(0, 80),
        focus: String(unit.focus ?? "完成核心内容").slice(0, 160),
        practice: String(unit.practice ?? "完成配套练习并复盘").slice(0, 160),
        estimatedDays: Math.max(1, Math.min(14, Number(unit.estimatedDays) || 1))
      };
    })
    .filter((unit: any) => unit.title)
    .slice(0, 80);

  const subjectCounts = normalizedUnits.reduce<Record<string, number>>((acc, unit) => {
    acc[unit.subjectName] = (acc[unit.subjectName] ?? 0) + 1;
    return acc;
  }, {});
  const missingCore = postgraduatePlan && ["数学一", "英语一", "408"].some((subject) => !subjectCounts[subject]);
  const politicsHeavy = postgraduatePlan && normalizedUnits.length > 0 && (subjectCounts["政治"] ?? 0) / normalizedUnits.length > 0.35;
  const finalUnits = missingCore || politicsHeavy ? defaultKaoyanSecondRoundUnits() : normalizedUnits;

  return {
    title: postgraduatePlan ? "考研二轮复习规划" : String(raw.title ?? "新的学习规划").slice(0, 40),
    goal: postgraduatePlan
      ? "在目标日期前均衡推进数学一、英语一、408和政治的第二轮复习，避免单科挤占整体节奏。"
      : String(raw.goal ?? "完成新的学习目标").slice(0, 400),
    targetDate: String(raw.targetDate ?? fallbackTargetDate),
    subjects: normalizedSubjects,
    units: finalUnits,
    strategy: postgraduatePlan
      ? [
          "二轮复习必须四科并行，数学一和408保持主线推进，英语保持阅读和作文连续，政治以选择题和框架为主。",
          "每天至少保留一个主科推进任务和一个错题复盘任务。",
          "政治可以加入，但不应挤占全部任务。"
        ]
      : (Array.isArray(raw.strategy) ? raw.strategy : [])
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
        max_tokens: 5000,
        response_format: {
          type: "json_object"
        },
        messages: [
          {
            role: "system",
            content:
              '你是学习规划系统架构师。请只输出合法 json，不要 Markdown。JSON 输出格式示例：{"title":"软考中级规划","goal":"在目标日期前完成教材、真题和错题复盘","targetDate":"2026-09-30","subjects":[{"name":"基础知识","color":"#2563eb"}],"units":[{"subjectName":"基础知识","title":"第1章 计算机系统基础","resource":"官方教程","focus":"理解核心概念","practice":"完成章节题并订正","estimatedDays":2}],"strategy":["先教材后真题","每周复盘错题"]}。输出字段必须是 title、goal、targetDate、subjects、units、strategy。subjects 每项包含 name、color。units 每项包含 subjectName、title、resource、focus、practice、estimatedDays。规划要能拆成每日打卡任务，单元不要过大，优先按教材章节/模块拆分。如果用户说考研第二轮/二轮复习且没有明确说政治专项，必须均衡覆盖数学一、英语一、408、政治四科；政治可以有，但不得超过总学习单元的四分之一，不能生成全政治规划。用户当前专业背景是人工智能专业考研，核心主科为数学一、英语一、408。'
          },
          {
            role: "user",
            content: `请输出合法 json。用户想创建一个独立学习打卡系统。\n目标日期：${targetDate || "用户未指定，请根据描述合理设置"}\n规划描述：${description}\n请生成可执行的完整规划蓝图。`
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

    sendJson(res, 200, { model, plan: normalizePlan(extractJson(content), targetDate, description) });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "创建规划失败。" });
  }
}
