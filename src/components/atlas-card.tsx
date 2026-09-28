import { useEffect, useRef, useState } from "react"
import { Activity } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { AtlasMetric } from "@/types"
import { cn } from "@/lib/utils"

interface AtlasCardProps {
  metrics: AtlasMetric[]
}

const statusColor: Record<AtlasMetric["status"], string> = {
  good: "#00FF66",
  warning: "#FFD700",
  critical: "#C8102E",
}

const statusDot: Record<AtlasMetric["status"], string> = {
  good: "bg-[#00FF66]",
  warning: "bg-[#FFD700]",
  critical: "bg-[#C8102E]",
}

function useChangedLabels(metrics: AtlasMetric[]): Record<string, boolean> {
  const prevRef = useRef<Record<string, AtlasMetric>>({})
  const [changedLabels, setChangedLabels] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newChanged = new Set<string>()
    for (const m of metrics) {
      const prev = prevRef.current[m.label]
      if (prev && (prev.value !== m.value || prev.status !== m.status)) {
        newChanged.add(m.label)
      }
    }
    if (newChanged.size > 0) {
      setChangedLabels(newChanged)
      const timer = setTimeout(() => setChangedLabels(new Set()), 2000)
      const map: Record<string, AtlasMetric> = {}
      for (const m of metrics) map[m.label] = m
      prevRef.current = map
      return () => clearTimeout(timer)
    }
    const map: Record<string, AtlasMetric> = {}
    for (const m of metrics) map[m.label] = m
    prevRef.current = map
  }, [metrics])

  return Object.fromEntries([...changedLabels].map((l) => [l, true])) as Record<string, boolean>
}

export function AtlasCard({ metrics }: AtlasCardProps) {
  const changedLabels = useChangedLabels(metrics)

  return (
    <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
          <Activity className="size-4 text-[#00FF66]" />
          ATLAS
          <span className="text-xs font-normal text-[#F8FAFC]/40">
            Body &amp; Load
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={cn(
              "flex flex-col gap-1 rounded-md px-2 py-1 transition-all duration-700",
              changedLabels[m.label] && "bg-[#FFD700]/10 scale-[1.02]"
            )}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block size-2 rounded-full transition-all duration-500",
                    statusDot[m.status],
                    changedLabels[m.label] && "scale-150 shadow-[0_0_6px_currentColor]"
                  )}
                />
                <span className="text-[#F8FAFC]/70">{m.label}</span>
              </div>
              <span
                className="font-semibold transition-colors duration-500"
                style={{ color: statusColor[m.status] }}
              >
                {m.value}
              </span>
            </div>
            {m.percent != null && (
              <Progress
                value={m.percent}
                className="h-1.5 bg-[#040D0A] transition-all duration-700 [&>[data-slot=progress-indicator]]:bg-[#00FF66]"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
