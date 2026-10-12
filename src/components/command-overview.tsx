import { Activity, Brain, CheckSquare, HeartPulse, ShieldAlert, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ActivityEntry, AtlasMetric, HelmAlert, MetisMetric, Task } from "@/types"

interface CommandOverviewProps {
  atlasMetrics: AtlasMetric[]
  metisMetrics: MetisMetric[]
  tasks: Task[]
  alerts: HelmAlert[]
  activityLog: ActivityEntry[]
}

const statusTone: Record<AtlasMetric["status"], string> = {
  good: "text-[#00FF66]",
  warning: "text-[#FFD700]",
  critical: "text-[#C8102E]",
}

function formatTimeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export function CommandOverview({ atlasMetrics, metisMetrics, tasks, alerts, activityLog }: CommandOverviewProps) {
  const completedTasks = tasks.filter((task) => task.completed).length
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
  const readiness = atlasMetrics.find((metric) => metric.label === "Readiness")
  const attentionItems = [
    ...atlasMetrics.filter((metric) => metric.status !== "good").map((metric) => `${metric.label}: ${metric.value}`),
    ...metisMetrics.filter((metric) => metric.status !== "good").map((metric) => `${metric.label}: ${metric.value}`),
  ]
  const latestActivity = activityLog.at(-1)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]/50">
              <HeartPulse className="size-4 text-[#00FF66]" />
              Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-semibold text-[#00FF66]">{readiness?.value ?? "—"}</span>
              <span className="text-right text-xs text-[#F8FAFC]/40">ATLAS<br />body signal</span>
            </div>
            <Progress value={readiness?.percent ?? 0} className="mt-4 h-1.5 bg-[#040D0A] [&>[data-slot=progress-indicator]]:bg-[#00FF66]" />
          </CardContent>
        </Card>

        <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]/50">
              <CheckSquare className="size-4 text-[#FFD700]" />
              Momentum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-semibold text-[#FFD700]">{completedTasks}/{tasks.length}</span>
              <span className="text-right text-xs text-[#F8FAFC]/40">KAIROS<br />complete</span>
            </div>
            <Progress value={taskProgress} className="mt-4 h-1.5 bg-[#040D0A] [&>[data-slot=progress-indicator]]:bg-[#FFD700]" />
          </CardContent>
        </Card>

        <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]/50">
              <ShieldAlert className="size-4 text-[#C8102E]" />
              Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-semibold text-[#C8102E]">{attentionItems.length}</span>
              <span className="text-right text-xs text-[#F8FAFC]/40">signals<br />to review</span>
            </div>
            <p className="mt-3 truncate text-xs text-[#F8FAFC]/50">{attentionItems[0] ?? "All systems nominal"}</p>
          </CardContent>
        </Card>

        <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]/50">
              <Activity className="size-4 text-[#F8FAFC]/60" />
              System pulse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-semibold text-[#F8FAFC]">{activityLog.length}</span>
              <span className="text-right text-xs text-[#F8FAFC]/40">events<br />recorded</span>
            </div>
            <p className="mt-3 truncate text-xs text-[#F8FAFC]/50">{latestActivity?.text ?? "Waiting for activity"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <Sparkles className="size-4 text-[#FFD700]" />
              Current operating picture
            </CardTitle>
            <Badge variant="outline" className="border-[#00FF66]/30 text-[#00FF66]">LIVE</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {atlasMetrics.map((metric) => (
              <div key={`atlas-${metric.label}`} className="rounded-lg border border-[#F8FAFC]/5 bg-[#040D0A]/50 p-3">
                <div className="flex items-center justify-between gap-3 text-xs text-[#F8FAFC]/45">
                  <span>{metric.label}</span>
                  <span className={statusTone[metric.status]}>{metric.status}</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-[#F8FAFC]">{metric.value}</p>
              </div>
            ))}
            {metisMetrics.map((metric) => (
              <div key={`metis-${metric.label}`} className="rounded-lg border border-[#F8FAFC]/5 bg-[#040D0A]/50 p-3">
                <div className="flex items-center justify-between gap-3 text-xs text-[#F8FAFC]/45">
                  <span>{metric.label}</span>
                  <span className={statusTone[metric.status]}>{metric.status}</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-[#F8FAFC]">{metric.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
              <Brain className="size-4 text-[#FFD700]" />
              Next best actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {tasks.filter((task) => !task.completed).slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-start gap-3 rounded-lg border border-[#F8FAFC]/5 bg-[#040D0A]/50 p-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-[#FFD700]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#F8FAFC]/80">{task.title}</p>
                  <p className="mt-1 text-xs text-[#F8FAFC]/35">Due {task.due_label}</p>
                </div>
              </div>
            ))}
            {tasks.filter((task) => !task.completed).length === 0 && (
              <p className="rounded-lg border border-[#00FF66]/20 bg-[#00FF66]/5 p-4 text-sm text-[#00FF66]">All tasks are clear.</p>
            )}
            {alerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="rounded-lg border border-[#C8102E]/20 bg-[#C8102E]/5 p-3">
                <p className="text-sm font-medium text-[#F8FAFC]/80">{alert.title}</p>
                <p className="mt-1 text-xs text-[#F8FAFC]/45">{alert.description} · {formatTimeAgo(alert.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
