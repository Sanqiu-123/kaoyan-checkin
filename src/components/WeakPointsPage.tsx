import { CheckCircle2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AppState, Subject, WeakPoint } from "@/types/study";
import { addDays, displayDate, todayKey } from "@/lib/date";
import { getReviewReminders, getWeakPointStats, subjectMeta } from "@/lib/studyData";
import { cn, uid } from "@/lib/utils";

interface WeakPointsPageProps {
  state: AppState;
  onChange: (weakPoints: WeakPoint[]) => void;
}

const subjects: Subject[] = ["math", "cs408", "english", "review"];

export function WeakPointsPage({ state, onChange }: WeakPointsPageProps) {
  const today = todayKey();
  const stats = getWeakPointStats(state, today);
  const reminders = getReviewReminders(state, today, 50);
  const activeItems = state.weakPoints
    .filter((item) => item.status !== "已掌握")
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
  const masteredItems = state.weakPoints.filter((item) => item.status === "已掌握").slice(0, 8);

  function patchItem(id: string, patch: Partial<WeakPoint>) {
    onChange(
      state.weakPoints.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    );
  }

  function addWeakPoint() {
    const now = new Date().toISOString();
    onChange([
      {
        id: uid("weak"),
        date: today,
        subject: "math",
        title: "新的薄弱点",
        source: "手动添加",
        status: "待复盘",
        reviewCount: 0,
        nextReviewDate: today,
        createdAt: now,
        updatedAt: now
      },
      ...state.weakPoints
    ]);
  }

  function reviewOnce(item: WeakPoint) {
    const nextCount = item.reviewCount + 1;
    patchItem(item.id, {
      status: nextCount >= 2 ? "复盘中" : "待复盘",
      reviewCount: nextCount,
      lastReviewedAt: new Date().toISOString(),
      nextReviewDate: addDays(today, nextCount >= 2 ? 7 : 3)
    });
  }

  function markMastered(item: WeakPoint) {
    patchItem(item.id, {
      status: "已掌握",
      lastReviewedAt: new Date().toISOString(),
      nextReviewDate: addDays(today, 30)
    });
  }

  function removeItem(id: string) {
    onChange(state.weakPoints.filter((item) => item.id !== id));
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">薄弱点库</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            保存打卡后，系统会从未完成任务、单项备注和今日总结中自动生成薄弱点。
          </p>
        </div>
        <Button onClick={addWeakPoint}>
          <Plus className="h-4 w-4" />
          手动添加
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">待处理薄弱点</p>
            <p className="mt-2 text-2xl font-semibold">{stats.active}</p>
            <Progress value={Math.min(stats.active * 8, 100)} className="mt-3" indicatorClassName="bg-orange-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">今日到期复盘</p>
            <p className="mt-2 text-2xl font-semibold">{stats.overdue}</p>
            <Progress value={Math.min(stats.overdue * 18, 100)} className="mt-3" indicatorClassName="bg-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">已掌握</p>
            <p className="mt-2 text-2xl font-semibold">{stats.mastered}</p>
            <Progress value={Math.min(stats.mastered * 10, 100)} className="mt-3" indicatorClassName="bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>到期复盘提醒</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.length === 0 ? (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                今天没有到期薄弱点。可以继续推进新任务，但晚间仍建议回看错题。
              </p>
            ) : (
              reminders.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className={cn("rounded-lg border border-border border-l-4 p-3", subjectMeta[item.subject].borderClass)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge className={subjectMeta[item.subject].badgeClass}>{subjectMeta[item.subject].name}</Badge>
                      <p className="mt-2 font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        来源：{item.source}，复盘{item.reviewCount}次，下次：{displayDate(item.nextReviewDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => reviewOnce(item)}>
                        <RotateCcw className="h-4 w-4" />
                        复盘一次
                      </Button>
                      <Button size="sm" onClick={() => markMastered(item)}>
                        <CheckCircle2 className="h-4 w-4" />
                        掌握
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>各科薄弱点分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.bySubject.map((row) => (
              <div key={row.subject} className="subtle-panel">
                <div className="flex items-center justify-between">
                  <Badge className={subjectMeta[row.subject].badgeClass}>{subjectMeta[row.subject].name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {row.total}个，{row.overdue}个到期
                  </span>
                </div>
                <Progress
                  value={Math.min(row.total * 10, 100)}
                  className="mt-3"
                  indicatorClassName={
                    row.subject === "math"
                      ? "bg-blue-500"
                      : row.subject === "cs408"
                        ? "bg-violet-500"
                        : row.subject === "english"
                          ? "bg-emerald-500"
                          : "bg-orange-500"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部未掌握薄弱点</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无未掌握薄弱点。</p>
          ) : (
            activeItems.map((item) => (
              <div
                key={item.id}
                className={cn("rounded-lg border border-border border-l-4 p-3", subjectMeta[item.subject].borderClass)}
              >
                <div className="grid gap-3 lg:grid-cols-[120px_1fr_110px_130px_210px_40px] lg:items-center">
                  <Select
                    value={item.subject}
                    onChange={(event) => patchItem(item.id, { subject: event.target.value as Subject })}
                  >
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subjectMeta[subject].name}
                      </option>
                    ))}
                  </Select>
                  <Input value={item.title} onChange={(event) => patchItem(item.id, { title: event.target.value })} />
                  <Select
                    value={item.status}
                    onChange={(event) => patchItem(item.id, { status: event.target.value as WeakPoint["status"] })}
                  >
                    <option value="待复盘">待复盘</option>
                    <option value="复盘中">复盘中</option>
                    <option value="已掌握">已掌握</option>
                  </Select>
                  <Input
                    type="date"
                    value={item.nextReviewDate}
                    onChange={(event) => patchItem(item.id, { nextReviewDate: event.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => reviewOnce(item)}>
                      复盘一次
                    </Button>
                    <Button size="sm" onClick={() => markMastered(item)}>
                      掌握
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} title="删除">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  来源：{item.source}，创建于{displayDate(item.date)}，已复盘{item.reviewCount}次
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {masteredItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近已掌握</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {masteredItems.map((item) => (
              <div key={item.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                <Badge className={subjectMeta[item.subject].badgeClass}>{subjectMeta[item.subject].name}</Badge>
                <p className="mt-2 font-medium">{item.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
