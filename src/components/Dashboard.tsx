import { AlertTriangle, ArrowRight, BookOpen, BrainCircuit, CheckCircle2, Clock, NotebookPen, Target } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppState } from "@/types/study";
import { addDays, daysUntil, displayDate, todayKey } from "@/lib/date";
import {
  buildDailyStrategy,
  buildTargetGapRows,
  buildSubjectHoursData,
  buildTrendData,
  getCompletionRate,
  getDashboardAlerts,
  getOverallProgress,
  getReviewReminders,
  getSubjectStats,
  getWeakPointStats,
  getWeekMinutes,
  getCurriculumFocusesForState,
  subjectMeta
} from "@/lib/studyData";
import { percent } from "@/lib/utils";
import { PageKey } from "@/components/AppShell";

interface DashboardProps {
  state: AppState;
  onNavigate: (page: PageKey) => void;
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function taskStartMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 24 * 60 + 30;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function Dashboard({ state, onNavigate }: DashboardProps) {
  const today = todayKey();
  const yesterday = addDays(today, -1);
  const record = state.records[today];
  const yesterdayRecord = state.records[yesterday];
  const totalTasks = record?.tasks.length ?? 0;
  const completedTasks = record?.tasks.filter((task) => task.completed).length ?? 0;
  const todayTasks = [...(record?.tasks ?? [])].sort(
    (a, b) => taskStartMinutes(a.time) - taskStartMinutes(b.time) || a.time.localeCompare(b.time)
  );
  const completionRate = getCompletionRate(record);
  const yesterdayCompletionRate = getCompletionRate(yesterdayRecord);
  const subjectStats = getSubjectStats(record);
  const trendData = buildTrendData(state);
  const hoursData = buildSubjectHoursData(state);
  const weekHours = (getWeekMinutes(state) / 60).toFixed(1);
  const progress = getOverallProgress(state.progress);
  const alerts = getDashboardAlerts(state);
  const daysLeft = daysUntil(state.settings.targetDate);
  const dailyStrategy = buildDailyStrategy(state, today);
  const curriculumFocuses = getCurriculumFocusesForState(state, today);
  const targetGapRows = buildTargetGapRows(state);
  const weakPointStats = getWeakPointStats(state);
  const reviewReminders = getReviewReminders(state, today, 4);

  return (
    <div className="page-shell">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="距离7月1日"
          value={daysLeft >= 0 ? `${daysLeft}天` : "已进入强化"}
          helper={`目标日期：${state.settings.targetDate}`}
          icon={Target}
        />
        <MetricCard label="今日任务" value={`${completedTasks}/${totalTasks}`} helper="已完成/总任务" icon={CheckCircle2} />
        <MetricCard label="今日完成率" value={percent(completionRate)} helper="保存后会生成建议" icon={BookOpen} />
        <MetricCard label="本周学习时长" value={`${weekHours}小时`} helper="最近7天累计" icon={Clock} />
      </div>

      <Card className="border-primary/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              今日学习策略
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{dailyStrategy.headline}</p>
          </div>
          <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
            {dailyStrategy.yesterdayRate === null ? "首次基线" : `昨日${dailyStrategy.yesterdayRate}%`}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold">今日优先级</p>
            {dailyStrategy.priorities.map((item) => (
              <p key={item} className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                {item}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">时间取舍</p>
            {dailyStrategy.timeAdvice.map((item) => (
              <p key={item} className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                {item}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">防偏提醒</p>
            {dailyStrategy.guardrails.map((item) => (
              <p key={item} className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                {item}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>今日教材焦点</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {curriculumFocuses.map((focus) => (
            <div key={focus.id} className={`rounded-lg border border-border border-l-4 p-3 ${subjectMeta[focus.subject].borderClass}`}>
              <div className="flex items-center justify-between gap-2">
                <Badge className={subjectMeta[focus.subject].badgeClass}>{subjectMeta[focus.subject].name}</Badge>
                <span className="text-xs text-muted-foreground">{focus.stage}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">
                {focus.resource}：{focus.unit}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{focus.title}</p>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p className="rounded-lg bg-muted/50 p-2">重点：{focus.focus}</p>
                <p className="rounded-lg bg-muted/50 p-2">练习：{focus.practice}</p>
                <p className="rounded-lg bg-muted/50 p-2">检查：{focus.checkpoint}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <div className="grid gap-3">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.text}-${index}`}
              className={
                alert.type === "danger"
                  ? "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                  : alert.type === "warning"
                    ? "rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
                    : "rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
              }
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{alert.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>目标差距看板</CardTitle>
            <Badge className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
              按7月1日前一轮估算
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {targetGapRows.map((row) => (
              <div key={row.subject} className={`rounded-lg border border-border border-l-4 p-3 ${subjectMeta[row.subject].borderClass}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={subjectMeta[row.subject].badgeClass}>{row.label}</Badge>
                      <Badge
                        className={
                          row.status === "正常"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                            : row.status === "停滞"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                              : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
                        }
                      >
                        {row.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">{row.current}</p>
                    <p className="mt-1 text-sm text-muted-foreground">剩余：{row.remaining}</p>
                  </div>
                  <div className="text-sm text-muted-foreground sm:text-right">
                    <p>所需速度：{row.requiredPace}/天</p>
                    <p>近7天速度：{row.recentPace}/天</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{row.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>薄弱点与复盘</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onNavigate("weakness")}>
              查看
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xl font-semibold">{weakPointStats.active}</p>
                <p className="text-xs text-muted-foreground">未掌握</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950/30 dark:text-red-100">
                <p className="text-xl font-semibold">{weakPointStats.overdue}</p>
                <p className="text-xs">到期</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100">
                <p className="text-xl font-semibold">{weakPointStats.mastered}</p>
                <p className="text-xs">掌握</p>
              </div>
            </div>
            {reviewReminders.length === 0 ? (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                今天暂无到期复盘。继续保持记录备注，系统会自动沉淀薄弱点。
              </div>
            ) : (
              reviewReminders.map((item) => (
                <div key={item.id} className={`rounded-lg border border-border border-l-4 p-3 ${subjectMeta[item.subject].borderClass}`}>
                  <div className="flex items-start gap-2">
                    <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {subjectMeta[item.subject].name}，已复盘{item.reviewCount}次
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>今日任务概览</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">显示当天全部任务，共 {totalTasks} 项</p>
            </div>
            <Button size="sm" onClick={() => onNavigate("checkin")}>
              去打卡
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {subjectStats
                .filter((stat) => stat.subject !== "review")
                .map((stat) => (
                  <div key={stat.subject} className="subtle-panel">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={subjectMeta[stat.subject].badgeClass}>{subjectMeta[stat.subject].name}</Badge>
                      <span className="text-sm font-semibold">{percent(stat.rate)}</span>
                    </div>
                    <Progress
                      value={stat.rate}
                      className="mt-3"
                      indicatorClassName={
                        stat.subject === "math"
                          ? "bg-blue-500"
                          : stat.subject === "cs408"
                            ? "bg-violet-500"
                            : "bg-emerald-500"
                      }
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {stat.completed}/{stat.total}项，{(stat.minutes / 60).toFixed(1)}小时
                    </p>
                  </div>
                ))}
            </div>
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border border-border border-l-4 p-3 text-sm ${
                    subjectMeta[task.subject].borderClass
                  } ${task.completed ? "bg-emerald-50/70 dark:bg-emerald-950/20" : "bg-card"}`}
                >
                  <CheckCircle2 className={task.completed ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-muted-foreground"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.time}</p>
                  </div>
                  <Badge className={subjectMeta[task.subject].badgeClass}>{subjectMeta[task.subject].shortName}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>当前一轮复习完成度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["数学一", progress.math, "bg-blue-500"],
              ["408", progress.cs408, "bg-violet-500"],
              ["英语一", progress.english, "bg-emerald-500"],
              ["总体", progress.overall, "bg-orange-500"]
            ].map(([label, value, color]) => (
              <div key={String(label)}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{value}%</span>
                </div>
                <Progress value={Number(value)} indicatorClassName={String(color)} />
              </div>
            ))}
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              当前默认按“7月1日前完成一轮”估算。章节、题量和阅读篇数可以在进度管理页手动修正。
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">昨日总结与建议</p>
                <Badge className="border-orange-200 bg-white/70 text-orange-700 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-100">
                  {displayDate(yesterday)}
                </Badge>
              </div>
              {yesterdayRecord ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-orange-800/80 dark:text-orange-100/80">
                    昨日完成率：{percent(yesterdayCompletionRate)}
                  </p>
                  <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-100">总结</p>
                    <p className="mt-1 text-muted-foreground">
                      {yesterdayRecord.summary.trim() || "昨日还没有填写总结，可以补充卡点、错题和未完成原因。"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-100">建议</p>
                    <p className="mt-1 text-muted-foreground">
                      {yesterdayRecord.suggestion.trim() || "昨日尚未保存打卡，保存后这里会显示系统建议。"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-muted-foreground">昨日暂无记录。可以到每日打卡页选择日期补打卡，首页会据此更新策略。</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近7天完成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="完成率" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="数学" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="408" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="英语" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>各科累计学习时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis dataKey="subject" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                    {hoursData.map((entry) => (
                      <Cell key={entry.subject} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
