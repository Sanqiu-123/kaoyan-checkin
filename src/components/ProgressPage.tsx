import { BookMarked, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProgressState } from "@/types/study";
import { getOverallProgress, getPlanStatus, stagePlans, subjectMeta } from "@/lib/studyData";
import { getCurriculumFocuses } from "@/lib/curriculum";
import { todayKey } from "@/lib/date";

interface ProgressPageProps {
  progress: ProgressState;
  onChange: (progress: ProgressState) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function ProgressPage({ progress, onChange }: ProgressPageProps) {
  const summary = getOverallProgress(progress);
  const planStatus = getPlanStatus(progress);
  const curriculumFocuses = getCurriculumFocuses(progress, todayKey());

  return (
    <div className="page-shell">
      <div>
        <h2 className="text-2xl font-semibold">进度管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">维护一轮复习进度，系统会用这些信息生成后续每日任务。</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          ["数学一", summary.math, "bg-blue-500"],
          ["408", summary.cs408, "bg-violet-500"],
          ["英语一", summary.english, "bg-emerald-500"],
          ["总体", summary.overall, "bg-orange-500"]
        ].map(([label, value, color]) => (
          <Card key={String(label)}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}%</p>
              <Progress value={Number(value)} className="mt-3" indicatorClassName={String(color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>当前教材级焦点</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {curriculumFocuses.map((focus) => (
            <div key={focus.id} className={`rounded-lg border border-border border-l-4 p-3 ${subjectMeta[focus.subject].borderClass}`}>
              <div className="flex items-center justify-between gap-2">
                <Badge className={subjectMeta[focus.subject].badgeClass}>{subjectMeta[focus.subject].name}</Badge>
                <span className="text-xs text-muted-foreground">{focus.statusText}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">
                {focus.resource}：{focus.unit} {focus.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{focus.focus}</p>
              <p className="mt-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">练习闭环：{focus.practice}</p>
              <p className="mt-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">今日检查点：{focus.checkpoint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>数学一进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="高数张宇30讲当前讲数">
              <Input
                type="number"
                min={0}
                max={18}
                value={progress.math.currentLecture}
                onChange={(event) =>
                  onChange({
                    ...progress,
                    math: { ...progress.math, currentLecture: Number(event.target.value) }
                  })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={progress.math.calculusDone}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, calculusDone: event.target.checked } })
                }
              />
              高数已完成
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={progress.math.linearStarted}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, linearStarted: event.target.checked } })
                }
              />
              线性代数已开始
            </label>
            <Field label="线性代数已完成单元数">
              <Input
                type="number"
                min={0}
                max={6}
                value={progress.math.linearUnit}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  onChange({
                    ...progress,
                    math: { ...progress.math, linearUnit: value, linearStarted: value > 0, linearDone: value >= 6 }
                  });
                }}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={progress.math.linearDone}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, linearDone: event.target.checked } })
                }
              />
              线性代数已完成
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={progress.math.probabilityStarted}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, probabilityStarted: event.target.checked } })
                }
              />
              概率论已开始
            </label>
            <Field label="概率论已完成单元数">
              <Input
                type="number"
                min={0}
                max={6}
                value={progress.math.probabilityUnit}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  onChange({
                    ...progress,
                    math: {
                      ...progress.math,
                      probabilityUnit: value,
                      probabilityStarted: value > 0,
                      probabilityDone: value >= 6
                    }
                  });
                }}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={progress.math.probabilityDone}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, probabilityDone: event.target.checked } })
                }
              />
              概率论已完成
            </label>
            <Field label="张宇1000题完成组数">
              <Input
                type="number"
                min={0}
                value={progress.math.zhangyu1000Done}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, zhangyu1000Done: Number(event.target.value) } })
                }
              />
            </Field>
            <Field label="数学错题数量">
              <Input
                type="number"
                min={0}
                value={progress.math.mistakeCount}
                onChange={(event) =>
                  onChange({ ...progress, math: { ...progress.math, mistakeCount: Number(event.target.value) } })
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>408进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="数据结构学习状态">
              <Select
                value={progress.cs408.dataStructureStatus}
                onChange={(event) =>
                  onChange({
                    ...progress,
                    cs408: {
                      ...progress.cs408,
                      dataStructureStatus: event.target.value as ProgressState["cs408"]["dataStructureStatus"]
                    }
                  })
                }
              >
                <option value="已学完">已学完</option>
                <option value="复习中">复习中</option>
                <option value="未开始">未开始</option>
              </Select>
            </Field>
            <Field label="数据结构课后题完成率">
              <Input
                type="number"
                min={0}
                max={100}
                value={progress.cs408.dataStructureExerciseRate}
                onChange={(event) =>
                  onChange({
                    ...progress,
                    cs408: { ...progress.cs408, dataStructureExerciseRate: Number(event.target.value) }
                  })
                }
              />
            </Field>
            <Field label="操作系统当前章节">
              <Input
                type="number"
                min={1}
                value={progress.cs408.osChapter}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, osChapter: Number(event.target.value) } })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-600"
                checked={progress.cs408.osDone}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, osDone: event.target.checked } })
                }
              />
              操作系统已完成
            </label>
            <Field label="计算机组成原理当前章节">
              <Input
                type="number"
                min={1}
                value={progress.cs408.coaChapter}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, coaChapter: Number(event.target.value) } })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-600"
                checked={progress.cs408.coaDone}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, coaDone: event.target.checked } })
                }
              />
              计算机组成原理已完成
            </label>
            <Field label="计算机网络当前章节">
              <Input
                type="number"
                min={1}
                value={progress.cs408.networkChapter}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, networkChapter: Number(event.target.value) } })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-600"
                checked={progress.cs408.networkDone}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, networkDone: event.target.checked } })
                }
              />
              计算机网络已完成
            </label>
            <Field label="王道练习题完成率">
              <Input
                type="number"
                min={0}
                max={100}
                value={progress.cs408.wangdaoExerciseRate}
                onChange={(event) =>
                  onChange({ ...progress, cs408: { ...progress.cs408, wangdaoExerciseRate: Number(event.target.value) } })
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>英语一进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="单词累计天数">
              <Input
                type="number"
                min={0}
                value={progress.english.wordDays}
                onChange={(event) =>
                  onChange({ ...progress, english: { ...progress.english, wordDays: Number(event.target.value) } })
                }
              />
            </Field>
            <Field label="田静每日一句累计数量">
              <Input
                type="number"
                min={0}
                value={progress.english.sentenceCount}
                onChange={(event) =>
                  onChange({ ...progress, english: { ...progress.english, sentenceCount: Number(event.target.value) } })
                }
              />
            </Field>
            <Field label="阅读真题开始时间">
              <Input
                type="date"
                value={progress.english.readingStartDate}
                onChange={(event) =>
                  onChange({ ...progress, english: { ...progress.english, readingStartDate: event.target.value } })
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-600"
                checked={progress.english.readingStarted}
                onChange={(event) =>
                  onChange({ ...progress, english: { ...progress.english, readingStarted: event.target.checked } })
                }
              />
              英语阅读已开始
            </label>
            <Field label="已完成阅读篇数">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={progress.english.readingPassages}
                onChange={(event) =>
                  onChange({ ...progress, english: { ...progress.english, readingPassages: Number(event.target.value) } })
                }
              />
            </Field>
            <Field label="生词数量">
              <Input
                type="number"
                min={0}
                value={progress.english.newWords}
                onChange={(event) =>
                  onChange({ ...progress, english: { ...progress.english, newWords: Number(event.target.value) } })
                }
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>是否落后于阶段计划</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planStatus.map((row) => (
              <div key={row.subject} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{row.subject}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.current}</p>
                </div>
                <Badge
                  className={
                    row.status === "正常"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                      : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
                  }
                >
                  {row.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>一轮复习阶段计划</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              ["数学一", stagePlans.math],
              ["408", stagePlans.cs408],
              ["英语一", stagePlans.english]
            ].map(([title, rows]) => (
              <div key={String(title)} className="space-y-2">
                <p className="flex items-center gap-2 font-medium">
                  <BookMarked className="h-4 w-4 text-primary" />
                  {title}
                </p>
                {(rows as string[]).map((row) => (
                  <p key={row} className="flex gap-2 rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {row}
                  </p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
