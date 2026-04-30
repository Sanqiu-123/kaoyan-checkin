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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppState } from "@/types/study";
import {
  buildWeeklyReport,
  buildSubjectCompletionData,
  buildSubjectHoursData,
  buildTrendData,
  getCompletionRate,
  getTotalMinutes,
  subjectMeta
} from "@/lib/studyData";
import { displayDate } from "@/lib/date";
import { percent } from "@/lib/utils";

interface StatsPageProps {
  state: AppState;
}

export function StatsPage({ state }: StatsPageProps) {
  const trendData = buildTrendData(state);
  const hoursData = buildSubjectHoursData(state);
  const completionData = buildSubjectCompletionData(state);
  const weeklyReport = buildWeeklyReport(state);
  const recentRecords = Object.values(state.records)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="page-shell">
      <div>
        <h2 className="text-2xl font-semibold">统计分析</h2>
        <p className="mt-1 text-sm text-muted-foreground">观察最近7天完成率、各科学习时长和任务完成情况。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本周复习诊断</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="subtle-panel">
              <p className="text-sm text-muted-foreground">记录天数</p>
              <p className="mt-2 text-2xl font-semibold">{weeklyReport.days}</p>
            </div>
            <div className="subtle-panel">
              <p className="text-sm text-muted-foreground">总学习时长</p>
              <p className="mt-2 text-2xl font-semibold">{weeklyReport.totalHours}h</p>
            </div>
            <div className="subtle-panel">
              <p className="text-sm text-muted-foreground">平均完成率</p>
              <p className="mt-2 text-2xl font-semibold">{weeklyReport.averageRate}%</p>
            </div>
            <div className="subtle-panel">
              <p className="text-sm text-muted-foreground">待复盘</p>
              <p className="mt-2 text-2xl font-semibold">{weeklyReport.overdueWeakPoints.length}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {weeklyReport.subjectStats.map((stat) => (
              <div key={stat.subject} className="rounded-lg border border-border p-3">
                <Badge className={subjectMeta[stat.subject].badgeClass}>{subjectMeta[stat.subject].name}</Badge>
                <p className="mt-2 text-xl font-semibold">{stat.rate}%</p>
                <p className="text-sm text-muted-foreground">{(stat.minutes / 60).toFixed(1)}小时</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
              <p className="font-medium">下周建议</p>
              <div className="mt-2 space-y-1">
                {weeklyReport.suggestions.map((suggestion) => (
                  <p key={suggestion}>{suggestion}</p>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">本周判断</p>
              <p className="mt-2 text-muted-foreground">
                最稳定科目：
                {weeklyReport.strongest ? subjectMeta[weeklyReport.strongest.subject].name : "暂无"}；最需要补齐：
                {weeklyReport.weakest ? subjectMeta[weeklyReport.weakest.subject].name : "暂无"}。
              </p>
              {weeklyReport.overdueWeakPoints.length > 0 && (
                <p className="mt-2 text-muted-foreground">
                  优先复盘：{weeklyReport.overdueWeakPoints.map((item) => item.title).join("、")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近7天完成率折线图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="完成率" stroke="#f97316" strokeWidth={3} />
                  <Line type="monotone" dataKey="数学" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="408" stroke="#7c3aed" strokeWidth={2} />
                  <Line type="monotone" dataKey="英语" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近7天学习时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="学习时长" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>各科学习时长柱状图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
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

        <Card>
          <CardHeader>
            <CardTitle>各科任务完成情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis dataKey="subject" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="完成率" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近打卡明细</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无历史记录。</p>
          ) : (
            recentRecords.map((record) => (
              <div key={record.date} className="grid gap-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-4">
                <p className="font-medium">{displayDate(record.date)}</p>
                <p>完成率：{percent(getCompletionRate(record))}</p>
                <p>学习时长：{(getTotalMinutes(record) / 60).toFixed(1)}小时</p>
                <p className="truncate text-muted-foreground">{record.suggestion || "暂无建议"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
