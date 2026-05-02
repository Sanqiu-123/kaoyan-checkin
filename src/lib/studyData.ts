import {
  AppState,
  DailyRecord,
  ProgressState,
  Settings,
  StudyPhase,
  StudyTask,
  TaskStatus,
  Subject,
  SubjectStat,
  WeakPoint
} from "@/types/study";
import { addDays, compactDate, daysUntil, formatDateKey, isSameOrAfter, todayKey, toDate } from "@/lib/date";
import {
  getCs408Focus,
  getCurriculumFocuses as buildCurriculumFocuses,
  getEnglishFocus,
  getMathFocus
} from "@/lib/curriculum";
import { clamp, uid } from "@/lib/utils";

export const STORAGE_KEY = "ai-kaoyan-checkin-state-v1";

export const phaseMeta: Record<
  StudyPhase,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
  }
> = {
  first: {
    label: "一轮基础",
    shortLabel: "一轮",
    description: "按教材章节推进，建立完整知识框架。",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
  },
  second: {
    label: "二轮强化",
    shortLabel: "二轮",
    description: "按专题、错题和真题模块强化，优先闭环薄弱点。",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
  },
  sprint: {
    label: "冲刺模拟",
    shortLabel: "冲刺",
    description: "按套卷、限时训练和查漏补缺安排每日任务。",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
  }
};

export const subjectMeta: Record<
  Subject,
  {
    name: string;
    shortName: string;
    chartColor: string;
    badgeClass: string;
    softClass: string;
    borderClass: string;
  }
> = {
  math: {
    name: "数学一",
    shortName: "数学",
    chartColor: "#2563eb",
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
    softClass: "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-100",
    borderClass: "border-l-blue-500"
  },
  cs408: {
    name: "408专业课",
    shortName: "408",
    chartColor: "#7c3aed",
    badgeClass:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
    softClass: "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-100",
    borderClass: "border-l-violet-500"
  },
  english: {
    name: "英语一",
    shortName: "英语",
    chartColor: "#16a34a",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    softClass: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
    borderClass: "border-l-emerald-500"
  },
  review: {
    name: "复盘计划",
    shortName: "复盘",
    chartColor: "#f97316",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200",
    softClass: "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-100",
    borderClass: "border-l-orange-500"
  }
};

export const defaultSettings: Settings = {
  targetDate: "2026-07-01",
  dailyStudyHours: 10,
  darkMode: false,
  studyPhase: "first"
};

export const defaultCloudSync = {
  enabled: false,
  autoSync: false,
  lastSyncedAt: undefined,
  lastPulledAt: undefined,
  lastError: undefined
};

export const defaultProgress: ProgressState = {
  math: {
    currentLecture: 5,
    calculusDone: false,
    linearStarted: false,
    linearUnit: 0,
    linearDone: false,
    probabilityStarted: false,
    probabilityUnit: 0,
    probabilityDone: false,
    zhangyu1000Done: 18,
    mistakeCount: 0
  },
  cs408: {
    dataStructureStatus: "已学完",
    dataStructureExerciseRate: 65,
    osChapter: 2,
    osDone: false,
    coaChapter: 1,
    coaDone: false,
    networkChapter: 1,
    networkDone: false,
    wangdaoExerciseRate: 32
  },
  english: {
    wordDays: 1,
    sentenceCount: 1,
    readingStartDate: "2026-05-15",
    readingStarted: false,
    readingPassages: 0,
    newWords: 0
  }
};

export const stagePlans: Record<StudyPhase, Record<"math" | "cs408" | "english", string[]>> = {
  first: {
    math: [
      "现在到5月下旬：完成张宇30讲高数部分",
      "5月下旬到6月上旬：完成线性代数一轮",
      "6月中旬到6月底：完成概率论一轮",
      "6月底：回顾高数重点章节和错题"
    ],
    cs408: [
      "现在到5月中旬：完成操作系统一轮",
      "5月下旬到6月上旬：完成计算机组成原理一轮",
      "6月中旬：完成计算机网络一轮",
      "6月下旬：四科整体回顾，补数据结构和操作系统错题"
    ],
    english: [
      "现在到5月中旬：单词+田静每日一句",
      "5月中旬到6月中旬：加入早年真题阅读",
      "6月中旬到6月底：阅读精读+错题分析",
      "7月后：进入强化阶段"
    ]
  },
  second: {
    math: [
      "第1-2周：高数核心专题与一轮错题二刷",
      "第3-4周：线代、概率专题轮转，补证明和计算薄弱点",
      "第5周后：真题分题型训练，建立限时手感",
      "每天：至少完成一个错题闭环和一道中档综合题"
    ],
    cs408: [
      "第1-2周：数据结构与操作系统高频模块强化",
      "第3-4周：计组、计网概念题和计算题轮转",
      "每周：完成一组王道/真题选择题限时训练",
      "每天：把错因归档到薄弱点库并安排二刷"
    ],
    english: [
      "每天：单词复盘和真题生词回收",
      "每两天：一篇阅读精读，记录题型和错因",
      "每周：翻译或新题型专项训练",
      "持续：长难句不断线，作文素材开始沉淀"
    ]
  },
  sprint: {
    math: ["套卷限时训练", "错题快速回炉", "公式与方法卡片复背", "保留压轴题取舍复盘"],
    cs408: ["真题套卷选择题", "大题模板与易错概念", "四科错题轮转", "考前记忆点清单"],
    english: ["真题阅读限时", "作文模板与语料", "翻译和新题型保温", "单词低频回收"]
  }
};

export function createInitialState(): AppState {
  return {
    version: 1,
    records: {},
    progress: defaultProgress,
    settings: defaultSettings,
    cloudSync: defaultCloudSync,
    adjustmentLogs: [],
    weakPoints: [],
    customPlans: []
  };
}

export function normalizeState(parsed?: Partial<AppState> | null): AppState {
  if (!parsed) return createInitialState();
  return {
    ...createInitialState(),
    ...parsed,
    settings: { ...defaultSettings, ...parsed.settings },
    cloudSync: { ...defaultCloudSync, ...parsed.cloudSync },
    progress: {
      math: { ...defaultProgress.math, ...parsed.progress?.math },
      cs408: { ...defaultProgress.cs408, ...parsed.progress?.cs408 },
      english: { ...defaultProgress.english, ...parsed.progress?.english }
    },
    records: parsed.records ?? {},
    adjustmentLogs: parsed.adjustmentLogs ?? [],
    weakPoints: parsed.weakPoints ?? [],
    customPlans: parsed.customPlans ?? []
  };
}

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  try {
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeTask(
  date: string,
  time: string,
  subject: Subject,
  title: string,
  plannedMinutes: number
): StudyTask {
  return {
    id: uid("task"),
    date,
    time,
    subject,
    title,
    plannedMinutes,
    completed: false,
    status: "todo",
    actualMinutes: plannedMinutes,
    quality: "",
    note: "",
    autoGenerated: true
  };
}

function mathNewLessonTitle(progress: ProgressState, adjusted: boolean) {
  const focus = getMathFocus(progress);
  const base = `${focus.resource}：${focus.unit} ${focus.title}`;
  if (adjusted) return `${base}少量推进，优先补昨日薄弱点`;
  return `${base}新内容`;
}

function mathExerciseTitle(progress: ProgressState) {
  const focus = getMathFocus(progress);
  return focus.practice;
}

function mathPracticeDebtTitle(debt: PendingMathPracticeDebt, progress: ProgressState) {
  const focus = getMathFocus(progress);
  const prefix = debt.lecture ? `补高数第${debt.lecture}讲练习题` : "补昨日数学练习题";
  return `${prefix}：例题/1000题闭环，再推进${focus.unit}`;
}

function csNewLessonTitle(progress: ProgressState, adjusted: boolean, carryover = false) {
  const focus = getCs408Focus(progress);
  const base = `${focus.resource}：${focus.unit} ${focus.title}`;
  if (carryover) return `${base}续补未完成内容+教材收尾`;
  return adjusted ? `${base}教材复盘+少量新课` : `${base}新课+教材`;
}

function csExerciseTitle(progress: ProgressState) {
  const focus = getCs408Focus(progress);
  return focus.practice;
}

function cs408PracticeDebtTitle(debt: PendingCs408PracticeDebt) {
  const trackLabel: Record<Cs408Track, string> = {
    os: "操作系统",
    coa: "计组",
    network: "计网"
  };
  return `补${trackLabel[debt.track]}第${debt.chapter}章王道/课后题：${debt.detail || "题目闭环"}`;
}

export function getSubjectStats(record?: DailyRecord): SubjectStat[] {
  const subjects: Subject[] = ["math", "cs408", "english", "review"];
  return subjects.map((subject) => {
    const tasks = record?.tasks.filter((task) => task.subject === subject) ?? [];
    const completed = tasks.filter(isTaskDone).length;
    const partial = tasks.filter(isTaskPartial).length;
    const total = tasks.length;
    const minutes = tasks.reduce((sum, task) => sum + (Number(task.actualMinutes) || 0), 0);
    return {
      subject,
      total,
      completed,
      partial,
      todo: Math.max(0, total - completed - partial),
      rate: total ? ((completed + partial * 0.45) / total) * 100 : 0,
      minutes
    };
  });
}

export function getCompletionRate(record?: DailyRecord) {
  if (!record || record.tasks.length === 0) return 0;
  return ((record.tasks.filter(isTaskDone).length + record.tasks.filter(isTaskPartial).length * 0.45) / record.tasks.length) * 100;
}

export function getTotalMinutes(record?: DailyRecord) {
  return record?.tasks.reduce((sum, task) => sum + (Number(task.actualMinutes) || 0), 0) ?? 0;
}

function phaseOf(state: AppState): StudyPhase {
  return state.settings.studyPhase ?? "first";
}

function dayIndex(date: string) {
  return Math.abs(Math.floor(toDate(date).getTime() / 86400000));
}

function pickByDate<T>(date: string, items: T[]) {
  return items[dayIndex(date) % items.length];
}

const secondRoundTopics: Record<Subject, string[]> = {
  math: ["极限与连续", "导数应用", "不定积分", "定积分应用", "多元函数微分", "线性代数方程组", "特征值与二次型", "概率分布与数字特征"],
  cs408: ["线性表与栈队列", "树和图", "排序查找", "进程同步", "内存管理", "指令系统", "存储系统", "网络层与传输层"],
  english: ["阅读主旨题", "阅读细节题", "推理判断题", "词义句意题", "长难句翻译", "完形与新题型"],
  review: ["错题归档", "薄弱点二刷", "限时复盘", "明日任务取舍"]
};

function subjectDueWeakPoints(state: AppState, date: string, subject: Subject, limit = 2) {
  return state.weakPoints
    .filter((item) => item.subject === subject && item.status !== "已掌握" && item.nextReviewDate <= date)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate) || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

function subjectWeakFocus(state: AppState, date: string, subject: Subject, fallback: string) {
  const dueItems = subjectDueWeakPoints(state, date, subject, 2);
  if (dueItems.length === 0) return fallback;
  return dueItems.map((item) => item.title.replace(/^未完成：/, "")).join("、").slice(0, 42);
}

function previousRecords(state: AppState, date: string, count: number) {
  return Array.from({ length: count }, (_, index) => state.records[addDays(date, -(index + 1))]).filter(Boolean);
}

function mathRecordText(record: DailyRecord) {
  const mathTaskText = record.tasks
    .filter((task) => task.subject === "math")
    .map((task) => `${task.title} ${task.note}`)
    .join(" ");
  return `${record.summary} ${mathTaskText}`;
}

const unfinishedPattern = /(没学完|未学完|没看完|未看完|没听完|未听完|没完成|未完成|没有完成|还差|剩下|剩余|继续补|继续学|待补|差.*看完|差.*听完|差.*做完)/;
const practiceDebtPattern =
  /((练习|习题|题|1000题|660|王道|课后题|真题).*(没做|未做|没写|未写|没刷|未刷|没完成|未完成|没来得及|没时间)|((没做|未做|没写|未写|没刷|未刷).*(练习|习题|题|1000题|660|王道|课后题|真题)))/;

export function taskHasUnfinishedSignal(task: Pick<StudyTask, "title" | "note">) {
  const text = `${task.title} ${task.note}`;
  return unfinishedPattern.test(text) || practiceDebtPattern.test(text);
}

export function getTaskStatus(task: StudyTask): TaskStatus {
  if (task.status) return task.status;
  if (task.completed && taskHasUnfinishedSignal(task)) return "partial";
  return task.completed ? "done" : "todo";
}

export function isTaskDone(task: StudyTask) {
  return getTaskStatus(task) === "done";
}

export function isTaskPartial(task: StudyTask) {
  return getTaskStatus(task) === "partial";
}

export function isTaskUnfinished(task: StudyTask) {
  return getTaskStatus(task) !== "done";
}

function parseLectureNumber(value: string) {
  if (/^\d+$/.test(value)) return Number(value);
  const digits: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9
  };
  if (value === "十") return 10;
  if (value.startsWith("十")) return 10 + (digits[value.slice(1)] ?? 0);
  if (value.endsWith("十")) return (digits[value.slice(0, 1)] ?? 0) * 10;
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (digits[tens] ?? 1) * 10 + (digits[ones] ?? 0);
  }
  return digits[value] ?? 0;
}

function mentionedMathLecture(text: string) {
  const matches = [...text.matchAll(/第\s*(\d{1,2}|[一二三四五六七八九十]{1,3})\s*讲/g)]
    .map((match) => parseLectureNumber(match[1]))
    .filter((value) => value >= 1 && value <= 18);
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

function unfinishedMathLectureFromRecord(record: DailyRecord) {
  const text = mathRecordText(record);
  if (unfinishedPattern.test(text)) return mentionedMathLecture(record.summary) ?? mentionedMathLecture(text);

  const incompleteLesson = record.tasks.find(
    (task) =>
      task.subject === "math" &&
      isTaskUnfinished(task) &&
      /张宇30讲|高数第(\d+|[一二三四五六七八九十]+)讲|第\s*(\d+|[一二三四五六七八九十]+)\s*讲/.test(task.title)
  );
  return incompleteLesson ? mentionedMathLecture(incompleteLesson.title) : null;
}

interface PendingMathPracticeDebt {
  lecture: number | null;
  detail: string;
}

function mathPracticeDebtFromText(text: string, fallbackText = ""): PendingMathPracticeDebt | null {
  const combinedText = `${text} ${fallbackText}`;
  if (!practiceDebtPattern.test(combinedText)) return null;

  return {
    lecture: mentionedMathLecture(combinedText),
    detail: text.trim().slice(0, 42) || fallbackText.trim().slice(0, 42)
  };
}

function unfinishedMathPracticeFromRecord(record: DailyRecord) {
  for (const task of record.tasks.filter((item) => item.subject === "math")) {
    const pendingFromNote = mathPracticeDebtFromText(task.note, task.title);
    if (pendingFromNote) return pendingFromNote;

    if (isTaskUnfinished(task) && /1000题|660|练习|习题|错题|例题|题/.test(task.title)) {
      return {
        lecture: mentionedMathLecture(`${task.title} ${task.note}`),
        detail: task.title.slice(0, 42)
      };
    }
  }

  return mathPracticeDebtFromText(record.summary);
}

function hasCompletedMathPracticeRecord(record: DailyRecord) {
  return record.tasks.some((task) => task.subject === "math" && isTaskDone(task) && /1000题|660|练习|习题|错题|例题|题/.test(task.title));
}

type Cs408Track = "os" | "coa" | "network";

interface PendingCs408Focus {
  track: Cs408Track;
  chapter: number;
  detail: string;
}

interface PendingCs408PracticeDebt extends PendingCs408Focus {}

function extractChapterNumber(text: string) {
  const numeric = text.match(/(?:第\s*)?(\d{1,2})(?:\.\d+)?\s*章/);
  if (numeric) return Number(numeric[1]);

  const decimalSection = text.match(/(\d{1,2})\.\d+\s*(?:节|小节)?/);
  if (decimalSection) return Number(decimalSection[1]);

  const chinese = text.match(/第\s*([一二三四五六七八九十]{1,3})\s*章/);
  if (chinese) return parseLectureNumber(chinese[1]);

  return null;
}

function inferCs408Track(text: string): Cs408Track | null {
  if (/操作系统|进程|线程|调度|同步|互斥|死锁|内存|文件|I\/?O|输入输出/.test(text)) return "os";
  if (/计组|组成原理|计算机组成|CPU|Cache|存储|指令|总线|数据表示|运算器|控制器/.test(text)) return "coa";
  if (/计网|网络|TCP|IP|物理层|数据链路|网络层|传输层|应用层|HTTP|DNS/.test(text)) return "network";
  return null;
}

function clampCsChapter(track: Cs408Track, chapter: number) {
  const maxByTrack: Record<Cs408Track, number> = {
    os: 8,
    coa: 7,
    network: 6
  };
  return Math.max(1, Math.min(maxByTrack[track], chapter));
}

function pendingCs408FocusFromText(text: string, fallbackText = ""): PendingCs408Focus | null {
  const combinedText = `${text} ${fallbackText}`;
  if (!unfinishedPattern.test(combinedText)) return null;

  const track = inferCs408Track(combinedText);
  const chapter = extractChapterNumber(text) ?? extractChapterNumber(fallbackText);
  if (!track || !chapter) return null;

  return {
    track,
    chapter: clampCsChapter(track, chapter),
    detail: text.trim().slice(0, 42) || fallbackText.trim().slice(0, 42)
  };
}

function unfinishedCs408FocusFromRecord(record: DailyRecord) {
  for (const task of record.tasks.filter((item) => item.subject === "cs408")) {
    const pendingFromNote = pendingCs408FocusFromText(task.note, task.title);
    if (pendingFromNote) return pendingFromNote;

    if (isTaskUnfinished(task)) {
      const track = inferCs408Track(task.title);
      const chapter = extractChapterNumber(task.title);
      if (track && chapter) {
        return {
          track,
          chapter: clampCsChapter(track, chapter),
          detail: task.title.slice(0, 42)
        };
      }
    }
  }

  return pendingCs408FocusFromText(record.summary);
}

function pendingCs408PracticeFromText(text: string, fallbackText = ""): PendingCs408PracticeDebt | null {
  const combinedText = `${text} ${fallbackText}`;
  if (!practiceDebtPattern.test(combinedText)) return null;

  const track = inferCs408Track(combinedText);
  const chapter = extractChapterNumber(text) ?? extractChapterNumber(fallbackText);
  if (!track || !chapter) return null;

  return {
    track,
    chapter: clampCsChapter(track, chapter),
    detail: text.trim().slice(0, 42) || fallbackText.trim().slice(0, 42)
  };
}

function unfinishedCs408PracticeFromRecord(record: DailyRecord) {
  for (const task of record.tasks.filter((item) => item.subject === "cs408")) {
    const pendingFromNote = pendingCs408PracticeFromText(task.note, task.title);
    if (pendingFromNote) return pendingFromNote;

    if (isTaskUnfinished(task) && /王道|练习|课后题|错题|选择题|真题|题/.test(task.title)) {
      const track = inferCs408Track(task.title);
      const chapter = extractChapterNumber(task.title);
      if (track && chapter) {
        return {
          track,
          chapter: clampCsChapter(track, chapter),
          detail: task.title.slice(0, 42)
        };
      }
    }
  }

  return pendingCs408PracticeFromText(record.summary);
}

function hasCompletedCs408LessonRecord(record: DailyRecord) {
  if (unfinishedCs408FocusFromRecord(record)) return false;
  return record.tasks.some(
    (task) => task.subject === "cs408" && isTaskDone(task) && /新课|教材/.test(task.title)
  );
}

function pendingCs408FocusFromRecentRecords(state: AppState, date: string) {
  for (const record of previousRecords(state, date, 3)) {
    const pendingFocus = unfinishedCs408FocusFromRecord(record);
    if (pendingFocus) return pendingFocus;
    if (hasCompletedCs408LessonRecord(record)) return null;
  }
  return null;
}

function pendingCs408PracticeFromRecentRecords(state: AppState, date: string) {
  for (const record of previousRecords(state, date, 3)) {
    const pendingPractice = unfinishedCs408PracticeFromRecord(record);
    if (pendingPractice) return pendingPractice;
    if (record.tasks.some((task) => task.subject === "cs408" && isTaskDone(task) && /王道|练习|课后题|错题|选择题|真题|题/.test(task.title))) {
      return null;
    }
  }
  return null;
}

type EnglishArea = "word" | "sentence" | "reading";

function inferEnglishArea(text: string): EnglishArea | null {
  if (/阅读|真题|精读|篇/.test(text)) return "reading";
  if (/长难句|每日一句|翻译|句子/.test(text)) return "sentence";
  if (/单词|生词|词汇/.test(text)) return "word";
  return null;
}

function unfinishedEnglishAreasFromRecord(record: DailyRecord) {
  const areas = new Set<EnglishArea>();

  record.tasks
    .filter((task) => task.subject === "english")
    .forEach((task) => {
      const text = `${task.title} ${task.note}`;
      if (!unfinishedPattern.test(text) && isTaskDone(task)) return;
      const area = inferEnglishArea(text);
      if (area) areas.add(area);
    });

  if (unfinishedPattern.test(record.summary)) {
    const area = inferEnglishArea(record.summary);
    if (area) areas.add(area);
  }

  return areas;
}

function pendingEnglishAreasFromRecentRecords(state: AppState, date: string) {
  const areas = new Set<EnglishArea>();
  previousRecords(state, date, 2).forEach((record) => {
    unfinishedEnglishAreasFromRecord(record).forEach((area) => areas.add(area));
  });
  return areas;
}

function hasCompletedMathLessonRecord(record: DailyRecord) {
  return record.tasks.some(
    (task) =>
      task.subject === "math" &&
      isTaskDone(task) &&
      /张宇30讲|高数第(\d+|[一二三四五六七八九十]+)讲|第\s*(\d+|[一二三四五六七八九十]+)\s*讲/.test(task.title) &&
      /新内容|网课|少量推进/.test(task.title)
  );
}

function completedMathLectureFromRecord(record: DailyRecord) {
  return mentionedMathLecture(
    record.tasks
      .filter((task) => task.subject === "math" && isTaskDone(task))
      .map((task) => task.title)
      .join(" ")
  );
}

function pendingMathLectureFromRecentRecords(state: AppState, date: string) {
  for (const record of previousRecords(state, date, 3)) {
    const pendingLecture = unfinishedMathLectureFromRecord(record);
    if (pendingLecture) return pendingLecture;
    if (hasCompletedMathLessonRecord(record)) return null;
  }
  return null;
}

function completedMathLectureFromRecentRecords(state: AppState, date: string) {
  for (const record of previousRecords(state, date, 3)) {
    const completedLecture = completedMathLectureFromRecord(record);
    if (completedLecture) return completedLecture;
  }
  return null;
}

function pendingMathPracticeFromRecentRecords(state: AppState, date: string) {
  for (const record of previousRecords(state, date, 3)) {
    const pendingPractice = unfinishedMathPracticeFromRecord(record);
    if (pendingPractice) return pendingPractice;
    if (hasCompletedMathPracticeRecord(record)) return null;
  }
  return null;
}

export function getPlanningProgress(state: AppState, date = todayKey()): ProgressState {
  const pendingMathLecture = pendingMathLectureFromRecentRecords(state, date);
  const completedMathLecture = completedMathLectureFromRecentRecords(state, date);
  const pendingCs408Focus = pendingCs408FocusFromRecentRecords(state, date);
  const planningProgress: ProgressState = {
    math: { ...state.progress.math },
    cs408: { ...state.progress.cs408 },
    english: { ...state.progress.english }
  };

  if (pendingMathLecture) {
    planningProgress.math.currentLecture = pendingMathLecture;
    planningProgress.math.calculusDone = false;
  } else if (
    completedMathLecture &&
    !state.progress.math.calculusDone &&
    completedMathLecture >= state.progress.math.currentLecture
  ) {
    planningProgress.math.currentLecture = Math.min(18, completedMathLecture >= 18 ? 18 : completedMathLecture + 1);
    planningProgress.math.calculusDone = completedMathLecture >= 18;
  }

  if (pendingCs408Focus) {
    if (pendingCs408Focus.track === "os") {
      planningProgress.cs408.osChapter = pendingCs408Focus.chapter;
      planningProgress.cs408.osDone = false;
    }
    if (pendingCs408Focus.track === "coa") {
      planningProgress.cs408.osDone = true;
      planningProgress.cs408.coaChapter = pendingCs408Focus.chapter;
      planningProgress.cs408.coaDone = false;
    }
    if (pendingCs408Focus.track === "network") {
      planningProgress.cs408.osDone = true;
      planningProgress.cs408.coaDone = true;
      planningProgress.cs408.networkChapter = pendingCs408Focus.chapter;
      planningProgress.cs408.networkDone = false;
    }
  }

  return planningProgress;
}

export function getCurriculumFocusesForState(state: AppState, date = todayKey()) {
  return buildCurriculumFocuses(getPlanningProgress(state, date), date);
}

export function getDailyFocusCards(state: AppState, date = todayKey()) {
  const phase = phaseOf(state);
  if (phase === "first") return getCurriculumFocusesForState(state, date);

  const isSprint = phase === "sprint";
  const mathTopic = subjectWeakFocus(state, date, "math", pickByDate(date, secondRoundTopics.math));
  const csTopic = subjectWeakFocus(state, date, "cs408", pickByDate(date, secondRoundTopics.cs408));
  const englishTopic = subjectWeakFocus(state, date, "english", pickByDate(date, secondRoundTopics.english));
  const recentRate = (subject: Subject) => {
    const records = getRecentRecords(state, date, 7);
    const subjectRecords = records
      .map((record) => getSubjectStats(record).find((item) => item.subject === subject))
      .filter(Boolean) as SubjectStat[];
    if (subjectRecords.length === 0) return "暂无近7天";
    const average = subjectRecords.reduce((sum, item) => sum + item.rate, 0) / subjectRecords.length;
    return `近7天${Math.round(average)}%`;
  };

  return [
    {
      id: `${phase}-math`,
      subject: "math" as Subject,
      resource: phaseMeta[phase].label,
      stage: phaseMeta[phase].label,
      unit: isSprint ? "限时模块卷" : "数学专题强化",
      title: mathTopic,
      focus: isSprint ? "控制时间、标记失分来源，保留可回收题。" : "先做题暴露问题，再回教材或笔记补方法。",
      practice: isSprint ? "模块卷/套卷错题复盘" : "专题题组+错题二刷",
      checkpoint: "能否说清错因、方法入口和下次规避动作。",
      reviewPrompt: "把错题归档到薄弱点库。",
      statusText: recentRate("math")
    },
    {
      id: `${phase}-cs408`,
      subject: "cs408" as Subject,
      resource: phaseMeta[phase].label,
      stage: phaseMeta[phase].label,
      unit: isSprint ? "真题选择题" : "408模块强化",
      title: csTopic,
      focus: "用题目反推概念漏洞，避免只看解析点头。",
      practice: isSprint ? "真题选择题限时+大题模板" : "王道错题二刷+真题选择题",
      checkpoint: "错题是否能回到具体概念、公式或流程图。",
      reviewPrompt: "把高频混淆概念写成对照卡。",
      statusText: recentRate("cs408")
    },
    {
      id: `${phase}-english`,
      subject: "english" as Subject,
      resource: phaseMeta[phase].label,
      stage: phaseMeta[phase].label,
      unit: isSprint ? "阅读与作文保温" : "真题阅读精读",
      title: englishTopic,
      focus: "阅读按题型和错因复盘，长难句不断线。",
      practice: isSprint ? "阅读限时+作文模板默写" : "真题阅读精读+长难句翻译",
      checkpoint: "能否定位原文依据、错项陷阱和生词复用。",
      reviewPrompt: "把生词和长难句回收到明日任务。",
      statusText: recentRate("english")
    }
  ];
}

function getFirstRoundPace(state: AppState, date: string, planningProgress = getPlanningProgress(state, date)) {
  const daysLeft = Math.max(daysUntil(state.settings.targetDate), 1);
  const completedCalculusLectures = planningProgress.math.calculusDone ? 18 : Math.max(0, planningProgress.math.currentLecture - 1);
  const mathRemaining =
    Math.max(0, 18 - completedCalculusLectures) +
    (planningProgress.math.linearDone ? 0 : Math.max(0, 6 - (planningProgress.math.linearUnit ?? 0))) +
    (planningProgress.math.probabilityDone ? 0 : Math.max(0, 6 - (planningProgress.math.probabilityUnit ?? 0)));
  const cs408Remaining =
    (planningProgress.cs408.osDone ? 0 : Math.max(0, 9 - planningProgress.cs408.osChapter)) +
    (planningProgress.cs408.coaDone ? 0 : Math.max(0, 8 - planningProgress.cs408.coaChapter)) +
    (planningProgress.cs408.networkDone ? 0 : Math.max(0, 7 - planningProgress.cs408.networkChapter));
  const englishWordRemaining = Math.max(0, 60 - planningProgress.english.wordDays);
  const englishSentenceRemaining = Math.max(0, 50 - planningProgress.english.sentenceCount);
  const englishReadingRemaining = Math.max(0, 20 - planningProgress.english.readingPassages);

  return {
    daysLeft,
    mathRemaining,
    cs408Remaining,
    englishWordRemaining,
    englishSentenceRemaining,
    englishReadingRemaining,
    mathRequiredPace: mathRemaining / daysLeft,
    cs408RequiredPace: cs408Remaining / daysLeft,
    englishReadingRequiredPace: englishReadingRemaining / daysLeft
  };
}

export function buildAdjustmentMessages(state: AppState, date: string) {
  const messages: string[] = [];
  const phase = phaseOf(state);
  const [yesterday, twoDaysAgo, threeDaysAgo] = previousRecords(state, date, 3);
  const dueWeakPoints = state.weakPoints.filter((item) => item.status !== "已掌握" && item.nextReviewDate <= date);
  const pendingMathLecture = pendingMathLectureFromRecentRecords(state, date);
  const pendingMathPractice = pendingMathPracticeFromRecentRecords(state, date);
  const pendingCs408Focus = pendingCs408FocusFromRecentRecords(state, date);
  const pendingCs408Practice = pendingCs408PracticeFromRecentRecords(state, date);
  const pendingEnglishAreas = pendingEnglishAreasFromRecentRecords(state, date);
  const firstRoundPace = getFirstRoundPace(state, date);

  if (pendingMathLecture) {
    messages.push(`数学备注显示第${pendingMathLecture}讲未完成，今天先续补这一讲，再推进新内容。`);
  }

  if (pendingMathPractice) {
    messages.push(
      `数学练习备注显示${pendingMathPractice.lecture ? `第${pendingMathPractice.lecture}讲` : "昨日内容"}题目未闭环，今天先补${pendingMathPractice.detail || "练习题"}。`
    );
  }

  if (pendingCs408Focus) {
    const trackLabel: Record<Cs408Track, string> = {
      os: "操作系统",
      coa: "计组",
      network: "计网"
    };
    messages.push(
      `408备注显示${trackLabel[pendingCs408Focus.track]}第${pendingCs408Focus.chapter}章未收尾，今天先补${pendingCs408Focus.detail || "未完成内容"}。`
    );
  }

  if (pendingCs408Practice) {
    const trackLabel: Record<Cs408Track, string> = {
      os: "操作系统",
      coa: "计组",
      network: "计网"
    };
    messages.push(
      `408练习备注显示${trackLabel[pendingCs408Practice.track]}第${pendingCs408Practice.chapter}章题目未闭环，今天先补王道/课后题。`
    );
  }

  if (pendingEnglishAreas.size > 0) {
    const labels: Record<EnglishArea, string> = {
      word: "单词",
      sentence: "长难句/每日一句",
      reading: "阅读精读"
    };
    messages.push(`英语备注显示${[...pendingEnglishAreas].map((area) => labels[area]).join("、")}未完成，今天先续补后再加新量。`);
  }

  if (phase === "first") {
    if (firstRoundPace.mathRequiredPace >= 0.55) {
      messages.push(
        `数学一轮剩${firstRoundPace.mathRemaining}个推进单元，距目标日${firstRoundPace.daysLeft}天，今天至少完成一个可计入进度的数学单元。`
      );
    }
    if (firstRoundPace.cs408RequiredPace >= 0.25) {
      messages.push(
        `408一轮剩${firstRoundPace.cs408Remaining}章左右，距目标日${firstRoundPace.daysLeft}天，今天新课和王道练习必须绑定。`
      );
    }
    if (firstRoundPace.englishReadingRequiredPace >= 0.25) {
      messages.push(
        `英语阅读还剩${firstRoundPace.englishReadingRemaining}篇，距目标日${firstRoundPace.daysLeft}天，今天至少保留阅读或长难句精读。`
      );
    }
  }

  if (phase === "second") {
    messages.push("当前处于二轮强化，今日任务优先专题训练、错题二刷和真题分析，不再以新课推进为主。");
    if (dueWeakPoints.length > 0) {
      messages.push(`有${dueWeakPoints.length}个薄弱点到期，先清二刷任务，再安排新专题。`);
    }
  }

  if (phase === "sprint") {
    messages.push("当前处于冲刺模拟，今日优先限时套卷、错因归档和考前清单回收。");
    if (dueWeakPoints.length > 0) {
      messages.push(`有${dueWeakPoints.length}个薄弱点到期，套卷复盘后必须回收。`);
    }
  }

  if (yesterday) {
    const mathRate = getSubjectStats(yesterday).find((stat) => stat.subject === "math")?.rate ?? 0;
    if (mathRate < 60) {
      messages.push("昨日数学完成率较低，建议先补齐基础内容，不要急于推进新课。");
    }

    if (getCompletionRate(yesterday) > 85) {
      messages.push("昨日整体完成情况较好，今日可以按原计划继续推进。");
    }
  }

  if (yesterday && twoDaysAgo) {
    const csRates = [yesterday, twoDaysAgo].map(
      (record) => getSubjectStats(record).find((stat) => stat.subject === "cs408")?.rate ?? 0
    );
    if (csRates.every((rate) => rate < 60)) {
      messages.push("408需要及时做题，不建议只看网课；今日减少新课，补王道练习和错题。");
    }
  }

  if (yesterday && twoDaysAgo && threeDaysAgo) {
    const onlyWords = [yesterday, twoDaysAgo, threeDaysAgo].every((record) => {
      const englishTasks = record.tasks.filter((task) => task.subject === "english");
      const wordDone = englishTasks.some((task) => task.title.includes("单词") && isTaskDone(task));
      const sentenceDone = englishTasks.some(
        (task) => (task.title.includes("每日一句") || task.title.includes("长难句")) && isTaskDone(task)
      );
      return wordDone && !sentenceDone;
    });
    if (onlyWords) {
      messages.push("英语一不能只背单词，长难句训练要保持连续；今日恢复田静每日一句和句子分析。");
    }
  }

  return messages;
}

function createDailyRecord(
  date: string,
  tasks: StudyTask[],
  adjustmentMessages: string[],
  phase: StudyPhase,
  timestamp: string
): DailyRecord {
  return {
    date,
    tasks,
    summary: "",
    suggestion: "",
    adjustmentMessages,
    phase,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function generateSecondRoundRecord(
  date: string,
  state: AppState,
  adjustmentMessages: string[],
  timestamp: string,
  phase: StudyPhase
) {
  const mathTopic = subjectWeakFocus(state, date, "math", pickByDate(date, secondRoundTopics.math));
  const csTopic = subjectWeakFocus(state, date, "cs408", pickByDate(date, secondRoundTopics.cs408));
  const englishTopic = subjectWeakFocus(state, date, "english", pickByDate(date, secondRoundTopics.english));
  const dueWeakPoints = state.weakPoints
    .filter((item) => item.status !== "已掌握" && item.nextReviewDate <= date)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate) || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 4);
  const isSprint = phase === "sprint";

  const tasks: StudyTask[] = [
    makeTask(date, "08:00-08:35", "english", isSprint ? "单词低频词+作文语料回收" : "单词复盘：真题生词+旧词回收", 35),
    makeTask(
      date,
      "09:00-10:25",
      "math",
      isSprint ? `数学限时模块卷：${mathTopic}` : `数学专题训练：${mathTopic}`,
      85
    ),
    makeTask(
      date,
      "10:35-11:30",
      "math",
      isSprint ? "数学套卷错题复盘：定位失分原因" : `数学错题二刷：${mathTopic}`,
      55
    ),
    makeTask(
      date,
      "14:00-15:20",
      "cs408",
      isSprint ? `408真题选择题限时：${csTopic}` : `408模块强化：${csTopic}`,
      80
    ),
    makeTask(
      date,
      "15:30-16:30",
      "cs408",
      isSprint ? "408大题模板+易错概念回收" : `王道/真题错题二刷：${csTopic}`,
      60
    ),
    makeTask(
      date,
      "19:20-20:20",
      "english",
      isSprint ? `英语阅读限时+错因归类：${englishTopic}` : `英语真题阅读精读：${englishTopic}`,
      60
    ),
    makeTask(date, "20:30-21:00", "english", isSprint ? "作文模板默写+替换句积累" : "长难句翻译+阅读错因记录", 30),
    makeTask(date, "21:30-22:00", "review", isSprint ? "套卷复盘清单+明日查漏补缺" : "错题归档+明日二刷清单", 30)
  ];

  if (dueWeakPoints.length > 0) {
    tasks.push(
      makeTask(
        date,
        "22:00-22:25",
        "review",
        `到期薄弱点回收：${dueWeakPoints.map((item) => item.title).join("；").slice(0, 48)}`,
        25
      )
    );
  }

  return createDailyRecord(date, tasks, adjustmentMessages, phase, timestamp);
}

export function generateDailyRecord(date: string, state: AppState): DailyRecord {
  const timestamp = new Date().toISOString();
  const adjustmentMessages = buildAdjustmentMessages(state, date);
  const phase = phaseOf(state);

  if (phase === "second" || phase === "sprint") {
    return generateSecondRoundRecord(date, state, adjustmentMessages, timestamp, phase);
  }

  const mathAdjusted = adjustmentMessages.some(
    (message) => message.includes("数学完成率较低") || message.includes("数学备注显示")
  );
  const csAdjusted = adjustmentMessages.some(
    (message) => message.includes("408需要及时做题") || message.includes("408备注显示") || message.includes("408练习备注")
  );
  const englishAdjusted = adjustmentMessages.some(
    (message) => message.includes("英语一不能只背单词") || message.includes("英语备注显示")
  );
  const csCarryover = adjustmentMessages.some((message) => message.includes("408备注显示"));
  const planningProgress = getPlanningProgress(state, date);
  const firstRoundPace = getFirstRoundPace(state, date, planningProgress);
  const pendingMathPractice = pendingMathPracticeFromRecentRecords(state, date);
  const pendingCs408Practice = pendingCs408PracticeFromRecentRecords(state, date);
  const mathFocus = getMathFocus(planningProgress);
  const cs408Focus = getCs408Focus(planningProgress);
  const englishFocus = getEnglishFocus(planningProgress, date);
  const dueWeakPoints = state.weakPoints
    .filter((item) => item.status !== "已掌握" && item.nextReviewDate <= date)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate) || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 3);
  const readingActive =
    planningProgress.english.readingStarted || isSameOrAfter(date, planningProgress.english.readingStartDate);
  const mathPaceTight = firstRoundPace.mathRequiredPace >= 0.55;
  const cs408PaceTight = firstRoundPace.cs408RequiredPace >= 0.25;
  const englishPaceTight = firstRoundPace.englishReadingRequiredPace >= 0.25;
  const mathLessonMinutes = pendingMathPractice ? 115 : mathPaceTight ? 160 : mathAdjusted ? 95 : 150;
  const cs408LessonMinutes = pendingCs408Practice ? 105 : cs408PaceTight ? 150 : csAdjusted ? 95 : 140;

  const tasks: StudyTask[] = [
    makeTask(date, "08:00-08:40", "english", "背单词：新词+旧词复习", 40),
    makeTask(
      date,
      "08:40-09:00",
      "math",
      mathAdjusted ? "补昨日数学薄弱点：公式、例题、错题快速回看" : "回顾昨日数学：公式和方法复盘",
      20
    ),
    makeTask(date, "09:00-11:30", "math", mathNewLessonTitle(planningProgress, mathAdjusted || Boolean(pendingMathPractice)), mathLessonMinutes),
    makeTask(date, "11:30-12:00", "math", `数学知识点整理：${mathFocus.checkpoint}`, 30),
    makeTask(date, "14:00-16:20", "cs408", csNewLessonTitle(planningProgress, csAdjusted, csCarryover), cs408LessonMinutes),
    makeTask(date, "16:20-17:20", "cs408", pendingCs408Practice ? cs408PracticeDebtTitle(pendingCs408Practice) : csExerciseTitle(planningProgress), 60),
    makeTask(
      date,
      "17:20-17:50",
      "cs408",
      planningProgress.cs408.dataStructureExerciseRate < 100
        ? "补数据结构遗留题30分钟"
        : "408错题整理：数据结构/操作系统",
      30
    ),
    makeTask(date, "19:20-21:20", "math", pendingMathPractice ? mathPracticeDebtTitle(pendingMathPractice, planningProgress) : mathExerciseTitle(planningProgress), 120),
    makeTask(
      date,
      readingActive ? "21:20-21:40" : "21:20-22:00",
      "english",
      englishAdjusted ? `恢复田静每日一句：${englishFocus.checkpoint}` : `田静每日一句/长难句：${englishFocus.checkpoint}`,
      readingActive || englishPaceTight ? 20 : 40
    )
  ];

  if (readingActive || englishPaceTight) {
    tasks.push(makeTask(date, "21:40-22:00", "english", englishPaceTight ? `一轮阅读补速：${englishFocus.practice}` : englishFocus.practice, 20));
  }

  if (mathAdjusted || pendingMathPractice || mathPaceTight) {
    const title = pendingMathPractice
      ? `数学补题提醒：${pendingMathPractice.lecture ? `第${pendingMathPractice.lecture}讲` : "昨日"}练习必须闭环`
      : mathPaceTight
        ? `数学一轮进度校准：剩${firstRoundPace.mathRemaining}个单元，今天至少收尾1个`
        : "数学补任务提醒：先补例题和1000题错题，再推进新课";
    tasks.push(makeTask(date, "碎片时间", "math", title, 20));
  }

  if (csAdjusted || pendingCs408Practice || cs408PaceTight) {
    const title = pendingCs408Practice
      ? `408补题提醒：先完成${pendingCs408Practice.detail || "昨日王道/课后题"}`
      : cs408PaceTight
        ? `408一轮进度校准：剩${firstRoundPace.cs408Remaining}章，新课后必须做题`
        : `王道教材复习+错题回顾：${cs408Focus.checkpoint}`;
    tasks.push(makeTask(date, "碎片时间", "cs408", title, 25));
  }

  if (dueWeakPoints.length > 0) {
    tasks.push(
      makeTask(
        date,
        "22:20-22:40",
        "review",
        `薄弱点复盘：${dueWeakPoints.map((item) => item.title).join("；").slice(0, 48)}`,
        20
      )
    );
  }

  tasks.push(makeTask(date, "22:00-22:20", "review", "今日复盘+明日计划", 20));

  return {
    date,
    tasks,
    summary: "",
    suggestion: "",
    adjustmentMessages,
    phase,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function ensureTodayRecord(state: AppState, date = todayKey()) {
  if (state.records[date]) return state;
  return {
    ...state,
    records: {
      ...state.records,
      [date]: generateDailyRecord(date, state)
    }
  };
}

export function generateSuggestion(record: DailyRecord) {
  const totalRate = getCompletionRate(record);
  const stats = getSubjectStats(record);
  const math = stats.find((stat) => stat.subject === "math")!;
  const cs408 = stats.find((stat) => stat.subject === "cs408")!;
  const english = stats.find((stat) => stat.subject === "english")!;
  const phase = record.phase ?? "first";
  const undoneBySubject = (subject: Subject) =>
    record.tasks
      .filter((task) => task.subject === subject && isTaskUnfinished(task))
      .slice(0, 2)
      .map((task) => task.title);

  if (phase === "second" || phase === "sprint") {
    const phaseLabel = phaseMeta[phase].label;
    if (totalRate >= 85) {
      return `${phaseLabel}完成度不错，明天继续保留限时训练和错题二刷；不要因为完成率高就取消复盘记录。`;
    }

    const parts: string[] = [];
    if (math.rate < 70) {
      parts.push(`数学强化不足，明天先补${undoneBySubject("math").join("、") || "专题训练和错题二刷"}，不要只翻笔记。`);
    }
    if (cs408.rate < 70) {
      parts.push(`408需要用题目检验概念，明天优先补${undoneBySubject("cs408").join("、") || "王道错题和真题选择题"}。`);
    }
    if (english.rate < 70) {
      parts.push(`英语二轮不能断阅读，明天至少完成一篇真题阅读或长难句错因分析。`);
    }

    return parts.length > 0
      ? parts.join("")
      : `${phaseLabel}总体完成一般，明天减少新增内容，把错题、真题错因和薄弱点复盘做成闭环。`;
  }

  if (totalRate >= 85) {
    return "今日完成情况较好，可以按原计划继续推进。明天保持数学新课+1000题、408听课后及时做题、英语每日一句不断线。";
  }

  const parts: string[] = [];
  if (math.rate < 60) {
    const undone = undoneBySubject("math").join("、") || "基础题和错题";
    parts.push(`数学完成率偏低，明天先补${undone}，新课只做少量推进，避免高数基础断层。`);
  } else if (math.rate >= 80) {
    parts.push("数学节奏不错，明天可以继续推进新讲，并保留睡前公式回顾。");
  }

  if (cs408.rate < 60) {
    const practiceUndone = undoneBySubject("cs408").join("、") || "王道章节练习";
    parts.push(`408今天推进不足，建议明天下午减少新课时间，优先补${practiceUndone}，不要只看网课。`);
  }

  if (english.rate < 70) {
    parts.push("英语任务要保持连续，明天至少完成单词复习和田静每日一句，长难句不要断。");
  }

  if (parts.length === 0) {
    return "今日总体完成一般，明天按原计划推进，但每科至少保留一道复盘动作：数学错题、408练习、英语长难句。";
  }

  return parts.join("");
}

export function applyProgressFromRecord(progress: ProgressState, record: DailyRecord): ProgressState {
  const completed = record.tasks.filter(isTaskDone);
  const phase = record.phase ?? "first";
  const isReviewPhase = phase !== "first";
  const pendingMathLecture = unfinishedMathLectureFromRecord(record);
  const pendingCs408Focus = unfinishedCs408FocusFromRecord(record);
  const pendingEnglishAreas = unfinishedEnglishAreasFromRecord(record);
  const hasMathLesson = completed.some(
    (task) => task.subject === "math" && task.title.includes("张宇30讲") && task.title.includes("新内容")
  );
  const completedMathLecture = mentionedMathLecture(
    completed
      .filter((task) => task.subject === "math")
      .map((task) => task.title)
      .join(" ")
  );
  const hasMathPractice = completed.some(
    (task) => task.subject === "math" && /1000题|660|专题|错题|真题|套卷|模块卷/.test(task.title)
  );
  const hasWord = completed.some((task) => task.subject === "english" && task.title.includes("单词"));
  const hasSentence = completed.some(
    (task) => task.subject === "english" && (task.title.includes("每日一句") || task.title.includes("长难句"))
  );
  const hasReading = completed.some((task) => task.subject === "english" && /阅读|真题/.test(task.title));
  const hasCsLesson = !isReviewPhase && completed.some((task) => task.subject === "cs408" && task.title.includes("新课"));
  const hasDsPractice = completed.some((task) => task.subject === "cs408" && task.title.includes("补数据结构"));
  const hasWangdaoPractice = completed.some((task) => task.subject === "cs408" && /练习|王道|错题|真题|选择题/.test(task.title));

  const next: ProgressState = {
    math: { ...progress.math },
    cs408: { ...progress.cs408 },
    english: { ...progress.english }
  };

  if (pendingMathLecture) {
    next.math.currentLecture = pendingMathLecture;
    next.math.calculusDone = false;
  } else if (hasMathLesson && !next.math.calculusDone) {
    const finishedLecture = completedMathLecture ?? next.math.currentLecture;
    next.math.currentLecture = Math.min(18, finishedLecture >= 18 ? 18 : finishedLecture + 1);
    next.math.calculusDone = finishedLecture >= 18;
  } else if (hasMathLesson && !next.math.linearDone) {
    next.math.linearStarted = true;
    next.math.linearUnit = Math.min(6, (next.math.linearUnit ?? 0) + 1);
    next.math.linearDone = next.math.linearUnit >= 6;
  } else if (hasMathLesson && !next.math.probabilityDone) {
    next.math.probabilityStarted = true;
    next.math.probabilityUnit = Math.min(6, (next.math.probabilityUnit ?? 0) + 1);
    next.math.probabilityDone = next.math.probabilityUnit >= 6;
  }
  if (hasMathPractice) next.math.zhangyu1000Done += 1;
  if (isReviewPhase && hasMathPractice) {
    const closedMistakes = completed.filter((task) => task.subject === "math" && /错题|二刷|复盘/.test(task.title)).length;
    next.math.mistakeCount = Math.max(0, next.math.mistakeCount - closedMistakes);
  }
  if (hasWord && !pendingEnglishAreas.has("word")) next.english.wordDays += 1;
  if (hasSentence && !pendingEnglishAreas.has("sentence")) next.english.sentenceCount += 1;
  if (hasReading) {
    next.english.readingStarted = true;
    if (!pendingEnglishAreas.has("reading")) next.english.readingPassages += 0.5;
  }
  if (pendingCs408Focus) {
    if (pendingCs408Focus.track === "os") {
      next.cs408.osChapter = pendingCs408Focus.chapter;
      next.cs408.osDone = false;
    } else if (pendingCs408Focus.track === "coa") {
      next.cs408.osDone = true;
      next.cs408.coaChapter = pendingCs408Focus.chapter;
      next.cs408.coaDone = false;
    } else {
      next.cs408.osDone = true;
      next.cs408.coaDone = true;
      next.cs408.networkChapter = pendingCs408Focus.chapter;
      next.cs408.networkDone = false;
    }
  } else if (hasCsLesson) {
    if (!next.cs408.osDone) {
      next.cs408.osChapter += 1;
      next.cs408.osDone = next.cs408.osChapter > 8;
    } else if (!next.cs408.coaDone) {
      next.cs408.coaChapter += 1;
      next.cs408.coaDone = next.cs408.coaChapter > 8;
    } else if (!next.cs408.networkDone) {
      next.cs408.networkChapter += 1;
      next.cs408.networkDone = next.cs408.networkChapter > 7;
    }
  }
  if (hasDsPractice) {
    next.cs408.dataStructureExerciseRate = clamp(next.cs408.dataStructureExerciseRate + 5);
  }
  if (hasWangdaoPractice) {
    next.cs408.wangdaoExerciseRate = clamp(next.cs408.wangdaoExerciseRate + 2);
  }

  return next;
}

export function buildTrendData(state: AppState, endDate = todayKey()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(endDate, index - 6);
    const record = state.records[date];
    const stats = getSubjectStats(record);
    return {
      date,
      label: compactDate(date),
      完成率: Math.round(getCompletionRate(record)),
      数学: Math.round(stats.find((stat) => stat.subject === "math")?.rate ?? 0),
      "408": Math.round(stats.find((stat) => stat.subject === "cs408")?.rate ?? 0),
      英语: Math.round(stats.find((stat) => stat.subject === "english")?.rate ?? 0),
      学习时长: Number((getTotalMinutes(record) / 60).toFixed(1))
    };
  });
}

export function buildSubjectHoursData(state: AppState) {
  const totals: Record<Subject, number> = {
    math: 0,
    cs408: 0,
    english: 0,
    review: 0
  };

  Object.values(state.records).forEach((record) => {
    getSubjectStats(record).forEach((stat) => {
      totals[stat.subject] += stat.minutes;
    });
  });

  return (Object.keys(totals) as Subject[]).map((subject) => ({
    subject: subjectMeta[subject].shortName,
    hours: Number((totals[subject] / 60).toFixed(1)),
    fill: subjectMeta[subject].chartColor
  }));
}

export function buildSubjectCompletionData(state: AppState) {
  const totals: Record<Subject, { total: number; completed: number; partial: number }> = {
    math: { total: 0, completed: 0, partial: 0 },
    cs408: { total: 0, completed: 0, partial: 0 },
    english: { total: 0, completed: 0, partial: 0 },
    review: { total: 0, completed: 0, partial: 0 }
  };

  Object.values(state.records).forEach((record) => {
    getSubjectStats(record).forEach((stat) => {
      totals[stat.subject].total += stat.total;
      totals[stat.subject].completed += stat.completed;
      totals[stat.subject].partial += stat.partial;
    });
  });

  return (Object.keys(totals) as Subject[]).map((subject) => ({
    subject: subjectMeta[subject].shortName,
    完成率: totals[subject].total ? Math.round(((totals[subject].completed + totals[subject].partial * 0.45) / totals[subject].total) * 100) : 0
  }));
}

export function getWeekMinutes(state: AppState, endDate = todayKey()) {
  return Array.from({ length: 7 }, (_, index) => state.records[addDays(endDate, index - 6)]).reduce(
    (sum, record) => sum + getTotalMinutes(record),
    0
  );
}

export function getOverallProgress(progress: ProgressState) {
  const completedCalculusLectures = progress.math.calculusDone ? 18 : Math.max(0, progress.math.currentLecture - 1);
  const math =
    (Math.min(completedCalculusLectures, 18) / 18) * 45 +
    (progress.math.linearDone ? 25 : Math.min((progress.math.linearUnit ?? 0) / 6, 1) * 25) +
    (progress.math.probabilityDone ? 20 : Math.min((progress.math.probabilityUnit ?? 0) / 6, 1) * 20) +
    Math.min(progress.math.zhangyu1000Done / 90, 1) * 10;

  const cs408 =
    (progress.cs408.dataStructureStatus === "已学完" ? 22 : progress.cs408.dataStructureStatus === "复习中" ? 14 : 0) +
    Math.min(progress.cs408.dataStructureExerciseRate, 100) * 0.08 +
    (progress.cs408.osDone ? 25 : Math.min(progress.cs408.osChapter / 8, 1) * 25) +
    (progress.cs408.coaDone ? 22 : Math.min((progress.cs408.coaChapter - 1) / 8, 1) * 22) +
    (progress.cs408.networkDone ? 15 : Math.min((progress.cs408.networkChapter - 1) / 7, 1) * 15) +
    Math.min(progress.cs408.wangdaoExerciseRate, 100) * 0.08;

  const english =
    Math.min(progress.english.wordDays / 60, 1) * 35 +
    Math.min(progress.english.sentenceCount / 50, 1) * 30 +
    Math.min(progress.english.readingPassages / 20, 1) * 25 +
    (progress.english.readingStarted ? 10 : 0);

  return {
    math: Math.round(clamp(math)),
    cs408: Math.round(clamp(cs408)),
    english: Math.round(clamp(english)),
    overall: Math.round(clamp((math + cs408 + english) / 3))
  };
}

export function getDashboardAlerts(state: AppState, date = todayKey()) {
  const alerts: { type: "danger" | "warning" | "info"; text: string }[] = [];
  const phase = phaseOf(state);
  const recent = previousRecords(state, date, 4);
  const subjects: Subject[] = ["math", "cs408", "english"];

  subjects.forEach((subject) => {
    const inactiveDays = recent.filter((record) => {
      const stat = getSubjectStats(record).find((item) => item.subject === subject);
      return stat && stat.total > 0 && stat.completed === 0;
    }).length;
    if (inactiveDays >= 3) {
      alerts.push({
        type: "danger",
        text: `${subjectMeta[subject].name}连续多天未完成，可能拖慢${phaseMeta[phase].label}节奏。`
      });
    }
  });

  const todayRecord = state.records[date];
  todayRecord?.adjustmentMessages.forEach((message) => {
    alerts.push({ type: message.includes("较好") ? "info" : "warning", text: message });
  });

  const overdueWeakPoints = state.weakPoints.filter((item) => item.status !== "已掌握" && item.nextReviewDate <= date);
  if (overdueWeakPoints.length >= 3) {
    alerts.push({
      type: "danger",
      text: `当前有${overdueWeakPoints.length}个薄弱点到期未复盘，建议今晚先处理错题和卡点。`
    });
  }

  return alerts;
}

export function getPlanStatus(progress: ProgressState, date = todayKey(), phase: StudyPhase = "first") {
  if (phase !== "first") {
    return [
      {
        subject: "数学一",
        current: phase === "sprint" ? "限时模块卷与套卷复盘" : "专题强化与错题二刷",
        status: progress.math.mistakeCount > 80 ? "错题偏多" : "正常"
      },
      {
        subject: "408",
        current: phase === "sprint" ? "真题选择题与大题模板" : "四科模块轮转强化",
        status: progress.cs408.wangdaoExerciseRate < 70 ? "需补题" : "正常"
      },
      {
        subject: "英语一",
        current: progress.english.readingStarted
          ? `阅读已完成${progress.english.readingPassages}篇`
          : "需要启动真题阅读",
        status: progress.english.readingStarted ? "正常" : "需加入阅读"
      }
    ];
  }

  const current = toDate(date);
  const year = current.getFullYear();
  const may15 = formatDateKey(new Date(year, 4, 15));
  const may25 = formatDateKey(new Date(year, 4, 25));
  const jun10 = formatDateKey(new Date(year, 5, 10));
  const jun20 = formatDateKey(new Date(year, 5, 20));

  const rows = [
    {
      subject: "数学一",
      current: progress.math.calculusDone
        ? progress.math.linearDone
          ? progress.math.probabilityDone
            ? "一轮完成，进入回顾"
            : "概率论推进中"
          : "线性代数推进中"
        : `高数第${progress.math.currentLecture}讲附近`,
      status:
        date > may25 && !progress.math.calculusDone
          ? "偏慢"
          : date > jun10 && !progress.math.linearDone
            ? "需加速"
            : "正常"
    },
    {
      subject: "408",
      current: progress.cs408.osDone
        ? progress.cs408.coaDone
          ? progress.cs408.networkDone
            ? "四科回顾中"
            : `计网第${progress.cs408.networkChapter}章`
          : `计组第${progress.cs408.coaChapter}章`
        : `操作系统第${progress.cs408.osChapter}章`,
      status:
        date > may15 && !progress.cs408.osDone
          ? "偏慢"
          : date > jun10 && !progress.cs408.coaDone
            ? "需加速"
            : date > jun20 && !progress.cs408.networkDone
              ? "需加速"
              : "正常"
    },
    {
      subject: "英语一",
      current: progress.english.readingStarted
        ? `阅读已完成${progress.english.readingPassages}篇`
        : `单词${progress.english.wordDays}天，每日一句${progress.english.sentenceCount}句`,
      status: date > may15 && !progress.english.readingStarted ? "需加入阅读" : "正常"
    }
  ];

  return rows;
}

export function buildDailyStrategy(state: AppState, date = todayKey()) {
  const todayRecord = state.records[date];
  const phase = phaseOf(state);
  const [yesterday, twoDaysAgo] = previousRecords(state, date, 2);
  const yesterdayRate = yesterday ? Math.round(getCompletionRate(yesterday)) : null;
  const yesterdayStats = yesterday
    ? getSubjectStats(yesterday).filter((stat) => stat.subject !== "review" && stat.total > 0)
    : [];
  const weakestYesterday = [...yesterdayStats].sort((a, b) => a.rate - b.rate)[0];
  const targetGaps = buildTargetGapRows(state, date).filter((row) => row.status !== "正常");
  const overdueWeakPoints = getReviewReminders(state, date, 3);
  const adjustmentMessages = todayRecord?.adjustmentMessages ?? buildAdjustmentMessages(state, date);
  const focusCards = getDailyFocusCards(state, date);
  const priorities: string[] = [];
  const timeAdvice: string[] = [];
  const guardrails: string[] = [];

  if (!yesterday) {
    priorities.push("今天先完整跑一遍默认计划，晚上保存打卡，为后续自动调整建立基线。");
  }

  if (phase === "first") {
    priorities.push(`教材焦点：数学推进${focusCards[0].unit}，408推进${focusCards[1].unit}，英语保持${focusCards[2].unit}。`);
  } else {
    priorities.push(`当前阶段：${phaseMeta[phase].label}，今天用专题训练、错题二刷和真题分析替代线性新课推进。`);
  }
  timeAdvice.push(`上午数学检查点：${focusCards[0].checkpoint}。`);
  timeAdvice.push(`下午408检查点：${focusCards[1].checkpoint}。`);

  if (overdueWeakPoints.length > 0) {
    priorities.push(`先处理${overdueWeakPoints.length}个到期薄弱点：${overdueWeakPoints.map((item) => item.title).join("、")}。`);
    timeAdvice.push("晚间复盘时间优先给薄弱点，不要只写总结。");
  }

  if (weakestYesterday && weakestYesterday.rate < 60) {
    priorities.push(
      phase === "first"
        ? `昨日${subjectMeta[weakestYesterday.subject].name}完成率${Math.round(weakestYesterday.rate)}%，今天先补基础和练习，再推进新内容。`
        : `昨日${subjectMeta[weakestYesterday.subject].name}完成率${Math.round(weakestYesterday.rate)}%，今天先补错题和核心题组，再安排新专题。`
    );
  }

  if (targetGaps.length > 0) {
    priorities.push(`${targetGaps.map((row) => row.label).join("、")}相对当前目标偏慢，今天至少完成一个可计入进度的核心任务。`);
  }

  adjustmentMessages.forEach((message) => {
    if (!priorities.includes(message)) priorities.push(message);
  });

  if (priorities.length === 0) {
    priorities.push("今天按默认计划推进，确保每科都有一个可检查的完成结果。");
  }

  if (yesterdayRate !== null && yesterdayRate >= 85) {
    timeAdvice.push(phase === "first" ? "昨天整体完成较好，今天可以正常推进新课，但仍要保留错题复盘。" : "昨天整体完成较好，今天可以加一组限时训练，但仍要保留错题复盘。");
  } else if (yesterdayRate !== null && yesterdayRate < 60) {
    timeAdvice.push("昨天整体完成偏低，今天不要把计划排满，优先完成核心任务。");
  } else {
    timeAdvice.push("今天按默认节奏推进，上午数学、下午408、晚上题目和英语不断线。");
  }

  if (weakestYesterday?.subject === "math") {
    timeAdvice.push("数学新课时间可以压缩一点，把1000题和错题整理做实。");
  }
  if (weakestYesterday?.subject === "cs408") {
    timeAdvice.push("408下午先做王道教材和章节练习，网课只服务于做题。");
  }
  if (weakestYesterday?.subject === "english") {
    timeAdvice.push("英语今晚必须完成每日一句或长难句，不能只背单词。");
  }

  if (twoDaysAgo) {
    const csRates = [yesterday, twoDaysAgo]
      .filter(Boolean)
      .map((record) => getSubjectStats(record).find((stat) => stat.subject === "cs408")?.rate ?? 0);
    if (csRates.length === 2 && csRates.every((rate) => rate < 60)) {
      guardrails.push(phase === "first" ? "408已经连续两天偏低，今天不建议继续堆新课，先补练习闭环。" : "408已经连续两天偏低，今天不建议继续加模块，先补错题闭环。");
    }
  }

  guardrails.push("今日备注尽量写具体卡点，例如“进程同步PV不会建模”，系统会自动沉淀到薄弱点库。");
  guardrails.push("如果只能保底完成，优先顺序是：数学核心推进、408练习、英语长难句、复盘。");

  const headline =
    phase === "second"
      ? "今天的关键是把一轮留下的问题转成可复刷、可验证的二轮任务。"
      : phase === "sprint"
        ? "今天的关键是用限时训练暴露问题，再把失分点回收到考前清单。"
        : overdueWeakPoints.length > 0
      ? "今天的关键不是多学新内容，而是先把到期薄弱点清掉。"
      : targetGaps.length > 0
        ? "今天要兼顾推进和纠偏，至少把偏慢科目推进一个明确单元。"
        : yesterdayRate !== null && yesterdayRate >= 85
          ? "昨天完成不错，今天可以按原计划稳定推进。"
          : "今天重点是稳定完成核心任务，并留下可复盘的具体记录。";

  return {
    headline,
    yesterdayRate,
    priorities: priorities.slice(0, 4),
    timeAdvice: timeAdvice.slice(0, 3),
    guardrails: guardrails.slice(0, 3)
  };
}

function inferSubjectFromText(text: string): Subject {
  if (/数学|高数|线代|概率|积分|极限|导数|1000题|张宇/.test(text)) return "math";
  if (/408|数据结构|操作系统|计组|计网|进程|线程|王道|组成原理|网络/.test(text)) return "cs408";
  if (/英语|单词|阅读|长难句|每日一句|翻译|生词|田静/.test(text)) return "english";
  return "review";
}

function normalizeWeakTitle(title: string) {
  return title.replace(/\s+/g, "").replace(/[，。；、:：,.]/g, "").toLowerCase();
}

function splitNoteToWeakItems(text: string) {
  return text
    .split(/[\n。；;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .map((item) => item.slice(0, 42));
}

export function extractWeakPointsFromRecord(record: DailyRecord, existingWeakPoints: WeakPoint[]) {
  const now = new Date().toISOString();
  const existingKeys = new Set(
    existingWeakPoints
      .filter((item) => item.status !== "已掌握")
      .map((item) => `${item.subject}-${normalizeWeakTitle(item.title)}`)
  );
  const candidates: Array<{ subject: Subject; title: string; source: string; nextReviewDate: string }> = [];

  record.tasks.forEach((task) => {
    if (isTaskUnfinished(task) && task.subject !== "review") {
      candidates.push({
        subject: task.subject,
        title: `未完成：${task.title}`,
        source: `${record.date} 任务未完成`,
        nextReviewDate: addDays(record.date, 1)
      });
    }

    splitNoteToWeakItems(task.note).forEach((note) => {
      candidates.push({
        subject: task.subject,
        title: note,
        source: `${record.date} 单项备注`,
        nextReviewDate: addDays(record.date, 2)
      });
    });
  });

  splitNoteToWeakItems(record.summary).forEach((note) => {
    candidates.push({
      subject: inferSubjectFromText(note),
      title: note,
      source: `${record.date} 今日总结`,
      nextReviewDate: addDays(record.date, 2)
    });
  });

  return candidates
    .filter((candidate) => {
      const key = `${candidate.subject}-${normalizeWeakTitle(candidate.title)}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    })
    .map<WeakPoint>((candidate) => ({
      id: uid("weak"),
      date: record.date,
      subject: candidate.subject,
      title: candidate.title,
      source: candidate.source,
      status: "待复盘",
      reviewCount: 0,
      nextReviewDate: candidate.nextReviewDate,
      createdAt: now,
      updatedAt: now
    }));
}

export function getWeakPointStats(state: AppState, date = todayKey()) {
  const active = state.weakPoints.filter((item) => item.status !== "已掌握");
  const overdue = active.filter((item) => item.nextReviewDate <= date);
  const mastered = state.weakPoints.filter((item) => item.status === "已掌握");
  const bySubject = (["math", "cs408", "english", "review"] as Subject[]).map((subject) => ({
    subject,
    total: active.filter((item) => item.subject === subject).length,
    overdue: overdue.filter((item) => item.subject === subject).length
  }));

  return {
    active: active.length,
    overdue: overdue.length,
    mastered: mastered.length,
    bySubject
  };
}

export function getReviewReminders(state: AppState, date = todayKey(), limit = 6) {
  return state.weakPoints
    .filter((item) => item.status !== "已掌握" && item.nextReviewDate <= date)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate) || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

function getRecentRecords(state: AppState, endDate = todayKey(), days = 7) {
  return Array.from({ length: days }, (_, index) => state.records[addDays(endDate, index - days + 1)]).filter(Boolean);
}

function countRecentCompletedTasks(state: AppState, subject: Subject, matcher: (title: string) => boolean) {
  return getRecentRecords(state).reduce(
    (sum, record) =>
      sum +
      record.tasks.filter((task) => task.subject === subject && isTaskDone(task) && matcher(task.title)).length,
    0
  );
}

export function buildTargetGapRows(state: AppState, date = todayKey()) {
  const daysLeft = Math.max(daysUntil(state.settings.targetDate), 1);
  const phase = phaseOf(state);
  const planningProgress = getPlanningProgress(state, date);
  const firstRoundPace = getFirstRoundPace(state, date, planningProgress);
  const mathRemaining = firstRoundPace.mathRemaining;
  const cs408Remaining = firstRoundPace.cs408Remaining;

  if (phase !== "first") {
    const rows = (["math", "cs408", "english"] as Subject[]).map((subject) => {
      const activeWeakPoints = state.weakPoints.filter((item) => item.subject === subject && item.status !== "已掌握");
      const dueWeakPoints = activeWeakPoints.filter((item) => item.nextReviewDate <= date);
      const recentPace = countRecentCompletedTasks(state, subject, (title) =>
        subject === "english" ? /阅读|长难句|翻译|作文|真题/.test(title) : /专题|错题|真题|王道|套卷|模块|选择题/.test(title)
      );
      const requiredPace = Math.max(0.4, dueWeakPoints.length / daysLeft);
      return {
        subject,
        label: subjectMeta[subject].shortName,
        current: dueWeakPoints.length > 0 ? `${dueWeakPoints.length}个到期薄弱点待回收` : `${phaseMeta[phase].shortLabel}任务正常轮转`,
        remaining: `${activeWeakPoints.length}个未掌握薄弱点`,
        requiredPace,
        recentPace: recentPace / 7,
        suggestion:
          subject === "math"
            ? "数学二轮重心是专题限时、错题二刷和综合题复盘。"
            : subject === "cs408"
              ? "408二轮要按模块刷题，错因必须回到概念和公式。"
              : "英语二轮要围绕真题阅读、长难句和作文语料持续积累。"
      };
    });

    return rows.map((row) => {
      const status =
        row.recentPace === 0 && Number.parseFloat(row.remaining) > 0
          ? "停滞"
          : row.recentPace + 0.05 < row.requiredPace
            ? "偏慢"
            : "正常";
      return {
        ...row,
        requiredPace: Number(row.requiredPace.toFixed(2)),
        recentPace: Number(row.recentPace.toFixed(2)),
        status
      };
    });
  }

  const rows = [
    {
      subject: "math" as Subject,
      label: "数学一",
      current: planningProgress.math.calculusDone
        ? planningProgress.math.linearDone
          ? "线代已闭环，准备概率论/综合回顾"
          : `线性代数第${Math.min((planningProgress.math.linearUnit ?? 0) + 1, 6)}单元`
        : `高数第${planningProgress.math.currentLecture}讲进行中`,
      remaining: `${mathRemaining}个推进单元`,
      requiredPace: mathRemaining / daysLeft,
      recentPace: countRecentCompletedTasks(state, "math", (title) => /新内容|张宇30讲|线性代数|概率论/.test(title)) / 7,
      suggestion: "数学每天至少保留新课推进和1000题练习，薄弱章节不要只看答案。"
    },
    {
      subject: "cs408" as Subject,
      label: "408",
      current: planningProgress.cs408.osDone
        ? planningProgress.cs408.coaDone
          ? `计网第${planningProgress.cs408.networkChapter}章`
          : `计组第${planningProgress.cs408.coaChapter}章`
        : `操作系统第${planningProgress.cs408.osChapter}章`,
      remaining: `${cs408Remaining}章左右`,
      requiredPace: cs408Remaining / daysLeft,
      recentPace: countRecentCompletedTasks(state, "cs408", (title) => /新课|教材/.test(title)) / 7,
      suggestion: "408要把教材阅读和课后题绑定，连续低完成时先补题再推进新课。"
    },
    {
      subject: "english" as Subject,
      label: "英语一",
      current: planningProgress.english.readingStarted
        ? `阅读${planningProgress.english.readingPassages}篇`
        : "单词+每日一句阶段",
      remaining: `阅读${firstRoundPace.englishReadingRemaining}篇，长难句${firstRoundPace.englishSentenceRemaining}天，单词${firstRoundPace.englishWordRemaining}天`,
      requiredPace: firstRoundPace.englishReadingRequiredPace,
      recentPace:
        getRecentRecords(state).reduce(
          (sum, record) =>
            sum + record.tasks.filter((task) => task.subject === "english" && isTaskDone(task) && task.title.includes("阅读")).length,
          0
        ) / 7,
      suggestion: "英语不能只背单词，阅读启动后要固定做长难句和错因归纳。"
    }
  ];

  return rows.map((row) => {
    const status =
      row.recentPace === 0 && Number.parseFloat(row.remaining) > 0
        ? "停滞"
        : row.recentPace + 0.05 < row.requiredPace
          ? "偏慢"
          : "正常";
    return {
      ...row,
      requiredPace: Number(row.requiredPace.toFixed(2)),
      recentPace: Number(row.recentPace.toFixed(2)),
      status
    };
  });
}

export function buildWeeklyReport(state: AppState, date = todayKey()) {
  const records = getRecentRecords(state, date, 7);
  const subjectStats = (["math", "cs408", "english"] as Subject[]).map((subject) => {
    const total = records.reduce((sum, record) => sum + record.tasks.filter((task) => task.subject === subject).length, 0);
    const completed = records.reduce(
      (sum, record) => sum + record.tasks.filter((task) => task.subject === subject && isTaskDone(task)).length,
      0
    );
    const minutes = records.reduce(
      (sum, record) =>
        sum +
        record.tasks
          .filter((task) => task.subject === subject)
          .reduce((taskSum, task) => taskSum + (Number(task.actualMinutes) || 0), 0),
      0
    );

    return {
      subject,
      rate: total ? Math.round((completed / total) * 100) : 0,
      minutes
    };
  });
  const averageRate = records.length
    ? Math.round(records.reduce((sum, record) => sum + getCompletionRate(record), 0) / records.length)
    : 0;
  const weakest = [...subjectStats].sort((a, b) => a.rate - b.rate)[0];
  const strongest = [...subjectStats].sort((a, b) => b.rate - a.rate)[0];
  const overdueWeakPoints = getReviewReminders(state, date, 4);
  const targetGaps = buildTargetGapRows(state, date).filter((row) => row.status !== "正常");
  const suggestions: string[] = [];

  if (weakest) {
    suggestions.push(`${subjectMeta[weakest.subject].name}是本周短板，完成率${weakest.rate}%，下周先保证最低连续性。`);
  }
  if (overdueWeakPoints.length > 0) {
    suggestions.push(`当前有${overdueWeakPoints.length}个薄弱点到期复盘，建议每天晚间复盘至少2个。`);
  }
  if (targetGaps.length > 0) {
    suggestions.push(`${targetGaps.map((row) => row.label).join("、")}相对目标偏慢，需要减少低价值耗时。`);
  }
  if (suggestions.length === 0) {
    suggestions.push("本周节奏比较稳，可以继续按当前计划推进，同时保持错题复盘。");
  }

  return {
    days: records.length,
    totalHours: Number((records.reduce((sum, record) => sum + getTotalMinutes(record), 0) / 60).toFixed(1)),
    averageRate,
    subjectStats,
    weakest,
    strongest,
    overdueWeakPoints,
    suggestions
  };
}
