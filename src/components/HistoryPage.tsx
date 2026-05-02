import { useMemo, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AppState } from "@/types/study";
import { displayDate, todayKey } from "@/lib/date";
import { getCompletionRate, getSubjectStats, getTaskStatus, getTotalMinutes, subjectMeta } from "@/lib/studyData";
import { percent } from "@/lib/utils";

interface HistoryPageProps {
  state: AppState;
}

export function HistoryPage({ state }: HistoryPageProps) {
  const dates = useMemo(() => Object.keys(state.records).sort((a, b) => b.localeCompare(a)), [state.records]);
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? todayKey());
  const record = state.records[selectedDate];
  const stats = getSubjectStats(record);

  return (
    <div className="page-shell">
      <div>
        <h2 className="text-2xl font-semibold">历史记录</h2>
        <p className="mt-1 text-sm text-muted-foreground">查看任意一天的任务清单、完成率、学习时长和总结。</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>日期选择</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
              {dates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition ${
                    selectedDate === date
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/60"
                  }`}
                >
                  <span>{displayDate(date)}</span>
                  <span>{percent(getCompletionRate(state.records[date]))}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!record ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">这一天还没有打卡记录。</CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-5">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      日期
                    </p>
                    <p className="mt-2 text-xl font-semibold">{displayDate(record.date)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="text-sm text-muted-foreground">当天完成率</p>
                    <p className="mt-2 text-xl font-semibold">{percent(getCompletionRate(record))}</p>
                    <Progress value={getCompletionRate(record)} className="mt-3" indicatorClassName="bg-orange-500" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      学习时长
                    </p>
                    <p className="mt-2 text-xl font-semibold">{(getTotalMinutes(record) / 60).toFixed(1)}小时</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>各科情况</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {stats
                    .filter((stat) => stat.total > 0)
                    .map((stat) => (
                      <div key={stat.subject} className="subtle-panel">
                        <Badge className={subjectMeta[stat.subject].badgeClass}>{subjectMeta[stat.subject].name}</Badge>
                        <p className="mt-3 text-2xl font-semibold">{percent(stat.rate)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {stat.completed}完/{stat.partial}部分/{stat.total}项，{(stat.minutes / 60).toFixed(1)}小时
                        </p>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>任务详情</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {record.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-lg border border-border border-l-4 p-3 ${subjectMeta[task.subject].borderClass}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">
                            {getTaskStatus(task) === "done" ? "已完成" : getTaskStatus(task) === "partial" ? "部分完成" : "未完成"}：{task.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {task.time}，实际{task.actualMinutes || 0}分钟，质量：{task.quality || "未填写"}
                          </p>
                        </div>
                        <Badge className={subjectMeta[task.subject].badgeClass}>{subjectMeta[task.subject].name}</Badge>
                      </div>
                      {task.note && <p className="mt-2 text-sm text-muted-foreground">备注：{task.note}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>当天总结与建议</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="rounded-lg bg-muted/50 p-3">{record.summary || "当天未填写总结。"}</p>
                  <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                    {record.suggestion || "当天尚未保存打卡，暂无系统建议。"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
