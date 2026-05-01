import { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, Pause, Play, Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageKey } from "@/components/AppShell";
import { CustomPlanDailyRecord, CustomPlanTask, CustomStudyPlan, Quality } from "@/types/study";
import { displayDate, todayKey } from "@/lib/date";
import { requestDeepSeekCustomPlan } from "@/lib/aiPlanner";
import {
  boundedProgress,
  createCustomPlanFromBlueprint,
  customPlanMinutes,
  ensureCustomPlanRecord,
  generateCustomPlanRecord,
  getCustomPlanCompletion,
  getCustomPlanRecordRate,
  getNextUnits,
  qualityOrEmpty,
  saveCustomPlanRecord,
  setCustomPlanPaused,
  updateCustomPlanRecord
} from "@/lib/customPlans";

interface PlanWorkspacePageProps {
  plans: CustomStudyPlan[];
  onChange: (plans: CustomStudyPlan[]) => void;
  onNavigate: (page: PageKey) => void;
}

const qualityOptions: Quality[] = ["", "很好", "一般", "较差"];

function taskStartMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 24 * 60 + 30;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function PlanWorkspacePage({ plans, onChange, onNavigate }: PlanWorkspacePageProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accessCode, setAccessCode] = useState(() => localStorage.getItem("kaoyan-ai-access-code") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const today = todayKey();
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [plans]);

  function updatePlans(updater: (plans: CustomStudyPlan[]) => CustomStudyPlan[]) {
    onChange(updater(plans));
  }

  function replacePlan(nextPlan: CustomStudyPlan) {
    updatePlans((current) => current.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan)));
  }

  async function createPlan() {
    setBusy(true);
    setError("");
    localStorage.setItem("kaoyan-ai-access-code", accessCode);
    try {
      const result = await requestDeepSeekCustomPlan(description, targetDate, accessCode);
      const plan = createCustomPlanFromBlueprint(result.plan);
      onChange([plan, ...plans]);
      setSelectedPlanId(plan.id);
      setDescription("");
      setTargetDate("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "DeepSeek 创建规划失败。");
    } finally {
      setBusy(false);
    }
  }

  function ensureToday(plan: CustomStudyPlan) {
    const nextPlan = ensureCustomPlanRecord(plan, today);
    replacePlan(nextPlan);
    return nextPlan;
  }

  function updateRecord(plan: CustomStudyPlan, updater: (record: CustomPlanDailyRecord) => CustomPlanDailyRecord) {
    replacePlan(updateCustomPlanRecord(plan, today, updater));
  }

  function updateTask(plan: CustomStudyPlan, taskId: string, patch: Partial<CustomPlanTask>) {
    updateRecord(plan, (record) => ({
      ...record,
      tasks: record.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
      updatedAt: new Date().toISOString()
    }));
  }

  function saveRecord(plan: CustomStudyPlan) {
    const record = plan.records[today] ?? generateCustomPlanRecord(plan, today);
    replacePlan(saveCustomPlanRecord(plan, record));
  }

  function togglePause(plan: CustomStudyPlan) {
    replacePlan(setCustomPlanPaused(plan, !plan.paused));
  }

  function deletePlan(plan: CustomStudyPlan) {
    const ok = window.confirm(`确定删除“${plan.title}”吗？该规划的任务和历史记录都会删除，不会影响考研主规划。`);
    if (!ok) return;
    const nextPlans = plans.filter((item) => item.id !== plan.id);
    onChange(nextPlans);
    setSelectedPlanId(nextPlans[0]?.id ?? "");
  }

  const record = selectedPlan?.records[today];
  const taskList = [...(record?.tasks ?? [])].sort(
    (a, b) => taskStartMinutes(a.time) - taskStartMinutes(b.time) || a.time.localeCompare(b.time)
  );

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">规划空间</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            考研主规划和 DeepSeek 新规划互不干扰。暂停后不自动更新任务，继续后会按目标日期和当前进度重排。
          </p>
        </div>
        <Button onClick={() => onNavigate("dashboard")}>
          回到考研规划
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-blue-600" />
            用 DeepSeek 创建新规划
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="例如：我想3个月考下软考中级软件设计师，教材是官方教程和历年真题，每天晚上2小时，请帮我生成独立打卡规划。"
          />
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            <Input
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="AI访问口令"
            />
            <Button onClick={createPlan} disabled={busy || !description.trim()}>
              <Plus className="h-4 w-4" />
              {busy ? "创建中" : "创建规划"}
            </Button>
          </div>
          {error && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>规划列表</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-left text-sm text-blue-900 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">考研主规划</span>
                  <Badge className="border-blue-200 bg-white text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-100">
                    原系统
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-100/80">数学一、英语一、408，保留现有页面和数据。</p>
              </button>

              {sortedPlans.length === 0 ? (
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  还没有新规划。你可以让 DeepSeek 根据证书、教材、目标日期创建一个独立任务面板。
                </div>
              ) : (
                sortedPlans.map((plan) => {
                  const completion = boundedProgress(getCustomPlanCompletion(plan));
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full rounded-lg border p-3 text-left transition hover:bg-muted/60 ${
                        selectedPlan?.id === plan.id ? "border-primary bg-muted/50" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{plan.title}</span>
                        <Badge
                          className={
                            plan.paused
                              ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                          }
                        >
                          {plan.paused ? "已暂停" : "进行中"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{plan.goal}</p>
                      <Progress value={completion} className="mt-3" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {completion}% · 目标 {plan.targetDate}
                      </p>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!selectedPlan ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                选择一个新规划，或先用 DeepSeek 创建规划。
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{selectedPlan.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.goal}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => togglePause(selectedPlan)}>
                      {selectedPlan.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {selectedPlan.paused ? "继续" : "暂停"}
                    </Button>
                    <Button variant="outline" onClick={() => deletePlan(selectedPlan)} title="删除规划">
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>整体完成度</span>
                      <span>{boundedProgress(getCustomPlanCompletion(selectedPlan))}%</span>
                    </div>
                    <Progress value={getCustomPlanCompletion(selectedPlan)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xl font-semibold">{selectedPlan.units.filter((unit) => !unit.completed).length}</p>
                      <p className="text-xs text-muted-foreground">剩余单元</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xl font-semibold">{displayDate(today)}</p>
                      <p className="text-xs text-muted-foreground">今日日期</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xl font-semibold">{((customPlanMinutes(record) || 0) / 60).toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">今日时长</p>
                    </div>
                  </div>
                  {selectedPlan.strategy.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {selectedPlan.strategy.slice(0, 4).map((item) => (
                        <p key={item} className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">下一批学习单元</p>
                    <div className="mt-2 space-y-2">
                      {getNextUnits(selectedPlan, 3).map((unit) => {
                        const subject = selectedPlan.subjects.find((item) => item.id === unit.subjectId);
                        return (
                          <div key={unit.id} className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{subject?.name ?? "综合"}：</span>
                            {unit.title} · {unit.resource}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle>今日任务面板</CardTitle>
                  {selectedPlan.paused ? (
                    <Badge className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                      暂停中
                    </Badge>
                  ) : record ? (
                    <Button onClick={() => saveRecord(selectedPlan)}>
                      <Save className="h-4 w-4" />
                      保存打卡
                    </Button>
                  ) : (
                    <Button onClick={() => ensureToday(selectedPlan)}>
                      <Plus className="h-4 w-4" />
                      生成今日任务
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedPlan.paused ? (
                    <div className="rounded-lg bg-muted/50 p-5 text-sm text-muted-foreground">
                      该规划已暂停。暂停期间不会自动生成新任务，也不会推进进度。点击“继续”后会根据目标日期和剩余单元重新生成今日任务。
                    </div>
                  ) : !record ? (
                    <div className="rounded-lg bg-muted/50 p-5 text-center text-sm text-muted-foreground">
                      今天还没有任务。点击“生成今日任务”后开始打卡。
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span>今日完成率</span>
                          <span>{boundedProgress(getCustomPlanRecordRate(record))}%</span>
                        </div>
                        <Progress value={getCustomPlanRecordRate(record)} />
                      </div>
                      {taskList.map((task) => {
                        const subject = selectedPlan.subjects.find((item) => item.id === task.subjectId);
                        return (
                          <div key={task.id} className="rounded-lg border border-border p-3">
                            <div className="grid gap-3 lg:grid-cols-[24px_110px_1fr_92px_92px] lg:items-center">
                              <input
                                aria-label="完成任务"
                                type="checkbox"
                                checked={task.completed}
                                onChange={(event) => updateTask(selectedPlan, task.id, { completed: event.target.checked })}
                                className="h-5 w-5 accent-emerald-600"
                              />
                              <Input value={task.time} onChange={(event) => updateTask(selectedPlan, task.id, { time: event.target.value })} />
                              <Input value={task.title} onChange={(event) => updateTask(selectedPlan, task.id, { title: event.target.value })} />
                              <Input
                                type="number"
                                min={0}
                                value={task.actualMinutes}
                                onChange={(event) => updateTask(selectedPlan, task.id, { actualMinutes: Number(event.target.value) })}
                              />
                              <Select
                                value={task.quality}
                                onChange={(event) => updateTask(selectedPlan, task.id, { quality: qualityOrEmpty(event.target.value) })}
                              >
                                {qualityOptions.map((quality) => (
                                  <option key={quality || "empty"} value={quality}>
                                    {quality || "质量"}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Badge
                                className="shrink-0"
                                style={{
                                  borderColor: subject?.color,
                                  color: subject?.color,
                                  backgroundColor: `${subject?.color ?? "#64748b"}14`
                                }}
                              >
                                {subject?.name ?? "综合"}
                              </Badge>
                              <Input
                                value={task.note}
                                onChange={(event) => updateTask(selectedPlan, task.id, { note: event.target.value })}
                                placeholder="单项备注"
                              />
                            </div>
                          </div>
                        );
                      })}
                      <Textarea
                        value={record.summary}
                        onChange={(event) =>
                          updateRecord(selectedPlan, (current) => ({
                            ...current,
                            summary: event.target.value,
                            updatedAt: new Date().toISOString()
                          }))
                        }
                        placeholder="今日总结：记录未完成原因、卡点、明天要调整的地方。"
                      />
                      {record.suggestion && (
                        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{record.suggestion}</div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
