import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Home,
  Moon,
  NotebookPen,
  Settings,
  Sun,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayDate, todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

export type PageKey = "dashboard" | "checkin" | "history" | "progress" | "weakness" | "stats" | "settings";

interface AppShellProps {
  activePage: PageKey;
  darkMode: boolean;
  onNavigate: (page: PageKey) => void;
  onToggleDark: () => void;
  children: React.ReactNode;
}

const navItems: { key: PageKey; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "首页", icon: Home },
  { key: "checkin", label: "每日打卡", icon: CheckSquare },
  { key: "history", label: "历史记录", icon: CalendarDays },
  { key: "progress", label: "进度管理", icon: TrendingUp },
  { key: "weakness", label: "薄弱点", icon: NotebookPen },
  { key: "stats", label: "统计分析", icon: BarChart3 },
  { key: "settings", label: "设置", icon: Settings }
];

export function AppShell({ activePage, darkMode, onNavigate, onToggleDark, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">人工智能专业考研打卡系统</h1>
                <p className="text-sm text-muted-foreground">{displayDate(todayKey())}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onToggleDark} title="切换深色模式">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? "浅色" : "深色"}
            </Button>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
