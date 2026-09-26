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

export function MetisCard({ metrics }: MetisCardProps) {
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
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block size-2 rounded-full",
                  statusDot[m.status]
                )}
              />
              <span className="text-[#F8FAFC]/70">{m.label}</span>
            </div>
            <span
              className="font-semibold"
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
