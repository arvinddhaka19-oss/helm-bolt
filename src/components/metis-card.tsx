import { useEffect, useRef, useState } from "react"
import { Brain } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MetisMetric } from "@/types"
import { cn } from "@/lib/utils"

interface MetisCardProps {
  metrics: MetisMetric[]
}

const statusColor: Record<MetisMetric["status"], string> = {
  good: "#00FF66",
  warning: "#FFD700",
  critical: "#C8102E",
}

const statusDot: Record<MetisMetric["status"], string> = {
  good: "bg-[#00FF66]",
  warning: "bg-[#FFD700]",
  critical: "bg-[#C8102E]",
}

function useChangedLabels(metrics: MetisMetric[]): Set<string> {
  const prevRef = useRef<Record<string, MetisMetric>>({})
  const [changed, setChanged] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newChanged = new Set<string>()
    for (const m of metrics) {
      const prev = prevRef.current[m.label]
      if (prev && (prev.value !== m.value || prev.status !== m.status)) {
        newChanged.add(m.label)
      }
    }
    if (newChanged.size > 0) {
      setChanged(newChanged)
      const timer = setTimeout(() => setChanged(new Set()), 2000)
      const map: Record<string, MetisMetric> = {}
      for (const m of metrics) map[m.label] = m
      prevRef.current = map
      return () => clearTimeout(timer)
    }
    const map: Record<string, MetisMetric> = {}
    for (const m of metrics) map[m.label] = m
    prevRef.current = map
  }, [metrics])

  return changed
}

export function MetisCard({ metrics }: MetisCardProps) {
  const changedLabels = useChangedLabels(metrics)

  return (
    <Card className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]">
          <Brain className="size-4 text-[#FFD700]" />
          METIS
          <span className="text-xs font-normal text-[#F8FAFC]/40">
            Mind &amp; Insight
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1 text-sm transition-all duration-700",
              changedLabels.has(m.label) && "bg-[#FFD700]/10 scale-[1.02]"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block size-2 rounded-full transition-all duration-500",
                  statusDot[m.status],
                  changedLabels.has(m.label) && "scale-150 shadow-[0_0_6px_currentColor]"
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
        ))}
      </CardContent>
    </Card>
  )
}
