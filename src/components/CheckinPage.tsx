import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { DailyRecord, Quality, StudyTask, Subject } from "@/types/study";
import { displayDate } from "@/lib/date";
import { getCompletionRate, getSubjectStats, subjectMeta } from "@/lib/studyData";
import { cn, percent, uid } from "@/lib/utils";

interface CheckinPageProps {
  record?: DailyRecord;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onCreateRecord: () => void;
  onChange: (record: DailyRecord) => void;
  onSave: () => void;
}

const subjectOptions: Subject[] = ["math", "cs408", "english", "review"];
const qualityOptions: Quality[] = ["", "很好", "一般", "较差"];

export function CheckinPage({ record, selectedDate, onDateChange, onCreateRecord, onChange, onSave }: CheckinPageProps) {
  const completionRate = getCompletionRate(record);
  const stats = getSubjectStats(record);
  const sortedTasks = [...(record?.tasks ?? [])].sort((a, b) => a.time.localeCompare(b.time));

  function updateTask(taskId: string, patch: Partial<StudyTask>) {
    if (!record) return;
    onChange({
      ...record,
      tasks: record.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
      updatedAt: new Date().toISOString()
    });
  }

  function deleteTask(taskId: string) {
    if (!record) return;
    onChange({
      ...record,
      tasks: record.tasks.filter((task) => task.id !== taskId),
      updatedAt: new Date().toISOString()
    });
  }

  function addTask() {
    if (!record) return;
    const task: StudyTask = {
      id: uid("task"),
      date: record.date,
      time: "自定义",
      subject: "math",
      title: "自定义学习任务",
      plannedMinutes: 30,
      actualMinutes: 30,
      completed: false,
      quality: "",
      note: ""
    };
    onChange({ ...record, tasks: [...record.tasks, task], updatedAt: new Date().toISOString() });
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">每日打卡 / 补打卡</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayDate(selectedDate)}，可补录任意一天的学习完成情况。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} />
          {record ? (
            <Button onClick={onSave}>
              <Save className="h-4 w-4" />
              保存打卡
            </Button>
          ) : (
            <Button onClick={onCreateRecord}>
              <Plus className="h-4 w-4" />
              生成该日任务
            </Button>
          )}
        </div>
      </div>

      {!record ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold">这一天还没有任务记录</p>
            <p className="mt-2 text-sm text-muted-foreground">
              点击“生成该日任务”后，可以补录当天完成情况并生成系统建议。
            </p>
            <Button className="mt-5" onClick={onCreateRecord}>
              <Plus className="h-4 w-4" />
              生成该日任务
            </Button>
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>今日完成情况</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">总完成率</span>
                  <span>{percent(completionRate)}</span>
                </div>
                <Progress value={completionRate} indicatorClassName="bg-orange-500" />
              </div>
              {stats
                .filter((stat) => stat.total > 0)
                .map((stat) => (
                  <div key={stat.subject}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <Badge className={subjectMeta[stat.subject].badgeClass}>{subjectMeta[stat.subject].name}</Badge>
                      <span className="text-muted-foreground">
                        {stat.completed}/{stat.total}项，{(stat.minutes / 60).toFixed(1)}小时
                      </span>
                    </div>
                    <Progress
                      value={stat.rate}
                      indicatorClassName={
                        stat.subject === "math"
                          ? "bg-blue-500"
                          : stat.subject === "cs408"
                            ? "bg-violet-500"
                            : stat.subject === "english"
                              ? "bg-emerald-500"
                              : "bg-orange-500"
                      }
                    />
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>今日总结</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={record.summary}
                onChange={(event) =>
                  onChange({ ...record, summary: event.target.value, updatedAt: new Date().toISOString() })
                }
                placeholder="例如：数学积分部分不熟；操作系统进程同步较难；英语长难句翻译速度慢。"
              />
              {record.suggestion && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                  <p className="font-medium">系统建议</p>
                  <p className="mt-1">{record.suggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>任务清单</CardTitle>
            <Button variant="outline" size="sm" onClick={addTask}>
              <Plus className="h-4 w-4" />
              添加任务
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "rounded-lg border border-border border-l-4 bg-card p-3 transition",
                  subjectMeta[task.subject].borderClass,
                  task.completed && "animate-complete bg-emerald-50/70 dark:bg-emerald-950/20"
                )}
              >
                <div className="grid gap-3 lg:grid-cols-[24px_112px_1fr_118px_96px_100px_40px] lg:items-center">
                  <input
                    aria-label="完成任务"
                    type="checkbox"
                    checked={task.completed}
                    onChange={(event) => updateTask(task.id, { completed: event.target.checked })}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <Input value={task.time} onChange={(event) => updateTask(task.id, { time: event.target.value })} />
                  <Input value={task.title} onChange={(event) => updateTask(task.id, { title: event.target.value })} />
                  <Select
                    value={task.subject}
                    onChange={(event) => updateTask(task.id, { subject: event.target.value as Subject })}
                  >
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subjectMeta[subject].name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={task.actualMinutes}
                    onChange={(event) => updateTask(task.id, { actualMinutes: Number(event.target.value) })}
                    title="实际学习分钟数"
                  />
                  <Select
                    value={task.quality}
                    onChange={(event) => updateTask(task.id, { quality: event.target.value as Quality })}
                  >
                    {qualityOptions.map((quality) => (
                      <option key={quality || "empty"} value={quality}>
                        {quality || "质量"}
                      </option>
                    ))}
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} title="删除任务">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Input
                  className="mt-3"
                  value={task.note}
                  onChange={(event) => updateTask(task.id, { note: event.target.value })}
                  placeholder="单项备注，可记录卡点、错题、待补内容"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
