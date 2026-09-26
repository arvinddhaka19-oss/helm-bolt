import { useState } from "react"
import { AlertCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { HelmAlert } from "@/types"

interface AlertTickerProps {
  alerts: HelmAlert[]
  maxVisible?: number
}

export function AlertTicker({ alerts, maxVisible = 2 }: AlertTickerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = alerts
    .filter((a) => !dismissed.has(a.id))
    .slice(0, maxVisible)

  if (visible.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center px-4 pb-4 md:flex">
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2">
        {visible.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center gap-3 rounded-lg border border-[#C8102E]/40 bg-[#C8102E] px-4 py-3 shadow-lg shadow-[#C8102E]/20 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <AlertCircle className="size-5 shrink-0 text-[#F8FAFC]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F8FAFC]">
                {alert.title}
              </p>
              <p className="text-xs text-[#F8FAFC]/80">
                {alert.description}
              </p>
            </div>
            <span className="shrink-0 rounded bg-[#F8FAFC]/15 px-2 py-0.5 text-xs font-bold text-[#F8FAFC]">
              {alert.time}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              className="shrink-0 text-[#F8FAFC]/60 hover:text-[#F8FAFC] hover:bg-[#F8FAFC]/10"
              onClick={() =>
                setDismissed((prev) => {
                  const next = new Set(prev)
                  next.add(alert.id)
                  return next
                })
              }
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
