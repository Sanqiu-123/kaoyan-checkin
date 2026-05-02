import { type ChangeEvent, useRef, useState } from "react";
import { Cloud, CloudOff, Download, DownloadCloud, LogIn, LogOut, RotateCcw, Save, Upload, UploadCloud, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AppState, CloudSyncState, ProgressState, Settings, StudyPhase } from "@/types/study";
import { phaseMeta } from "@/lib/studyData";

interface SettingsPageProps {
  state: AppState;
  onSettingsChange: (settings: Settings) => void;
  onProgressChange: (progress: ProgressState) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  cloudConfigured: boolean;
  cloudUserEmail: string | null;
  cloudBusy: boolean;
  onCloudSignUp: (email: string, password: string) => void;
  onCloudSignIn: (email: string, password: string) => void;
  onCloudSignOut: () => void;
  onCloudSyncChange: (patch: Partial<CloudSyncState>) => void;
  onPushCloud: () => void;
  onPullCloud: () => void;
  onReset: () => void;
}

export function SettingsPage({
  state,
  onSettingsChange,
  onProgressChange,
  onExportBackup,
  onImportBackup,
  cloudConfigured,
  cloudUserEmail,
  cloudBusy,
  onCloudSignUp,
  onCloudSignIn,
  onCloudSignOut,
  onCloudSyncChange,
  onPushCloud,
  onPullCloud,
  onReset
}: SettingsPageProps) {
  const { settings } = state;
  const { progress } = state;
  const { cloudSync } = state;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function confirmReset() {
    const ok = window.confirm("确认清空所有本地打卡数据吗？此操作无法撤销。");
    if (ok) onReset();
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void onImportBackup(file);
    event.target.value = "";
  }

  function submitCloud(action: "login" | "signup") {
    if (!email.trim() || password.length < 6) {
      window.alert("请输入邮箱和至少6位密码。");
      return;
    }
    if (action === "login") onCloudSignIn(email.trim(), password);
    else onCloudSignUp(email.trim(), password);
  }

  return (
    <div className="page-shell">
      <div>
        <h2 className="text-2xl font-semibold">设置</h2>
        <p className="mt-1 text-sm text-muted-foreground">调整目标日期、每日学习时间和显示偏好。</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>基础设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">目标日期</span>
              <Input
                type="date"
                value={settings.targetDate}
                onChange={(event) => onSettingsChange({ ...settings, targetDate: event.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">每日计划学习时间（小时）</span>
              <Input
                type="number"
                min={1}
                step={0.5}
                value={settings.dailyStudyHours}
                onChange={(event) => onSettingsChange({ ...settings, dailyStudyHours: Number(event.target.value) })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">当前复习阶段</span>
              <Select
                value={settings.studyPhase}
                onChange={(event) => onSettingsChange({ ...settings, studyPhase: event.target.value as StudyPhase })}
              >
                {(["first", "second", "sprint"] as StudyPhase[]).map((phase) => (
                  <option key={phase} value={phase}>
                    {phaseMeta[phase].label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={settings.darkMode}
                onChange={(event) => onSettingsChange({ ...settings, darkMode: event.target.checked })}
              />
              启用深色模式
            </label>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Save className="mb-2 h-4 w-4 text-primary" />
              数据会自动保存到当前浏览器的 IndexedDB。建议每周导出一次 JSON 备份到电脑或网盘。
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷进度设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">当前正在学习的数学讲数</span>
              <Input
                type="number"
                min={1}
                max={18}
                value={progress.math.currentLecture}
                onChange={(event) =>
                  onProgressChange({
                    ...progress,
                    math: { ...progress.math, currentLecture: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">操作系统当前章节</span>
              <Input
                type="number"
                min={1}
                value={progress.cs408.osChapter}
                onChange={(event) =>
                  onProgressChange({
                    ...progress,
                    cs408: { ...progress.cs408, osChapter: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">计算机组成原理当前章节</span>
              <Input
                type="number"
                min={1}
                value={progress.cs408.coaChapter}
                onChange={(event) =>
                  onProgressChange({
                    ...progress,
                    cs408: { ...progress.cs408, coaChapter: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">计算机网络当前章节</span>
              <Input
                type="number"
                min={1}
                value={progress.cs408.networkChapter}
                onChange={(event) =>
                  onProgressChange({
                    ...progress,
                    cs408: { ...progress.cs408, networkChapter: Number(event.target.value) }
                  })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-600"
                checked={progress.english.readingStarted}
                onChange={(event) =>
                  onProgressChange({
                    ...progress,
                    english: { ...progress.english, readingStarted: event.target.checked }
                  })
                }
              />
              英语阅读是否开始
            </label>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>账号与云端同步</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={
                cloudConfigured
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
              }
            >
              <div className="flex items-start gap-2">
                {cloudConfigured ? <Cloud className="mt-0.5 h-4 w-4" /> : <CloudOff className="mt-0.5 h-4 w-4" />}
                <div>
                  <p className="font-medium">{cloudConfigured ? "Supabase 已配置" : "Supabase 未配置"}</p>
                  <p className="mt-1">
                    本系统始终先保存到本地 IndexedDB。云端同步失败、额度用完或断网时，只会记录错误，不影响继续打卡。
                  </p>
                </div>
              </div>
            </div>

            {!cloudConfigured ? (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                如需启用云同步，请复制 `.env.example` 为 `.env.local`，填入 Supabase 项目的 URL 和 anon key，再重启网站。
              </div>
            ) : cloudUserEmail ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium">已登录：{cloudUserEmail}</p>
                  <p className="mt-1 text-muted-foreground">
                    最近上传：{cloudSync.lastSyncedAt ? new Date(cloudSync.lastSyncedAt).toLocaleString("zh-CN") : "暂无"}
                  </p>
                  <p className="text-muted-foreground">
                    最近拉取：{cloudSync.lastPulledAt ? new Date(cloudSync.lastPulledAt).toLocaleString("zh-CN") : "暂无"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={cloudSync.enabled}
                    onChange={(event) => onCloudSyncChange({ enabled: event.target.checked })}
                  />
                  启用云端同步
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={cloudSync.autoSync}
                    disabled={!cloudSync.enabled}
                    onChange={(event) => onCloudSyncChange({ autoSync: event.target.checked })}
                  />
                  自动同步到云端
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={cloudBusy} onClick={onPushCloud}>
                    <UploadCloud className="h-4 w-4" />
                    上传本地到云端
                  </Button>
                  <Button variant="outline" disabled={cloudBusy} onClick={onPullCloud}>
                    <DownloadCloud className="h-4 w-4" />
                    从云端拉取
                  </Button>
                  <Button variant="outline" disabled={cloudBusy} onClick={onCloudSignOut}>
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">邮箱</span>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">密码</span>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={cloudBusy} onClick={() => submitCloud("login")}>
                    <LogIn className="h-4 w-4" />
                    登录
                  </Button>
                  <Button variant="outline" disabled={cloudBusy} onClick={() => submitCloud("signup")}>
                    <UserPlus className="h-4 w-4" />
                    注册
                  </Button>
                </div>
              </div>
            )}

            {cloudSync.lastError && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                云端状态：{cloudSync.lastError}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数据管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              当前共有 {Object.keys(state.records).length} 天记录，{state.adjustmentLogs.length} 条自动建议日志。主存储为
              IndexedDB，导出的 JSON 可以放到本地磁盘、OneDrive、坚果云或其他网盘。
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onExportBackup}>
                <Download className="h-4 w-4" />
                导出备份
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                导入备份
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="destructive" onClick={confirmReset}>
              <RotateCcw className="h-4 w-4" />
              清空全部数据
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
