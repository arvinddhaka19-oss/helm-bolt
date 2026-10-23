import { useEffect, useRef, useState } from "react"
import { Brain, ChevronDown } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MetricTrendChart } from "@/components/metric-trend-chart"
import { useMetricHistory } from "@/hooks/use-metric-history"
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

function MetricRow({ metric, changed }: { metric: MetisMetric; changed: boolean }) {
  const [open, setOpen] = useState(false)
  const { history, loading } = useMetricHistory(open ? metric.label : null)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-sm transition-all duration-700 hover:bg-[#040D0A]/50",
            changed && "bg-[#FFD700]/10 scale-[1.02]"
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2 rounded-full transition-all duration-500",
                statusDot[metric.status],
                changed && "scale-150 shadow-[0_0_6px_currentColor]"
              )}
            />
            <span className="text-[#F8FAFC]/70">{metric.label}</span>
            <ChevronDown className={cn("size-3 text-[#F8FAFC]/30 transition-transform", open && "rotate-180")} />
          </div>
          <span
            className="font-semibold transition-colors duration-500"
            style={{ color: statusColor[metric.status] }}
          >
            {metric.value}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 py-1">
          {loading ? (
            <p className="py-2 text-center text-xs text-[#F8FAFC]/30">Loading history...</p>
          ) : (
            <MetricTrendChart history={history} accentColor={statusColor[metric.status]} />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
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
          <MetricRow key={m.label} metric={m} changed={changedLabels.has(m.label)} />
        ))}
      </CardContent>
    </Card>
  )
}
