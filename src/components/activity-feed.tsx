import { useMemo, useState } from "react"
import { Activity, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityEntry } from "@/types"

interface ActivityFeedProps {
  entries: ActivityEntry[]
}

const sources = ["ALL", "HELM", "VOICE", "ATLAS", "METIS", "KAIROS"] as const

type SourceFilter = (typeof sources)[number]

const sourceColors: Record<ActivityEntry["source"], string> = {
  ATLAS: "text-[#00FF66]",
  METIS: "text-[#FFD700]",
  KAIROS: "text-[#FFD700]",
  HELM: "text-[#F8FAFC]/60",
  VOICE: "text-[#FFD700]",
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  const [filter, setFilter] = useState<SourceFilter>("ALL")
  const filteredEntries = useMemo(
    () => entries.filter((entry) => filter === "ALL" || entry.source === filter),
    [entries, filter]
  )

  return (
    <Card className="flex h-full min-h-0 flex-col border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
      <CardHeader className="gap-4 border-b border-[#F8FAFC]/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-[#F8FAFC]">
            <Activity className="size-4 text-[#00FF66]" />
            System activity
          </CardTitle>
          <p className="mt-1 text-xs text-[#F8FAFC]/40">Every signal, command, and module update in one place.</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="size-3.5 shrink-0 text-[#F8FAFC]/30" />
          {sources.map((source) => (
            <Button
              key={source}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(source)}
              className={filter === source ? "h-7 bg-[#FFD700]/15 px-2 text-[10px] text-[#FFD700]" : "h-7 px-2 text-[10px] text-[#F8FAFC]/40 hover:bg-[#040D0A] hover:text-[#F8FAFC]"}
            >
              {source}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
        {filteredEntries.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center text-sm text-[#F8FAFC]/35">No activity for this filter.</div>
        ) : (
          <div className="divide-y divide-[#F8FAFC]/5">
            {[...filteredEntries].reverse().map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[#040D0A]/40 sm:px-6">
                <Badge variant="outline" className={`mt-0.5 border-[#F8FAFC]/10 bg-[#040D0A]/50 text-[10px] ${sourceColors[entry.source]}`}>
                  {entry.source}
                </Badge>
                <p className="min-w-0 flex-1 text-sm leading-6 text-[#F8FAFC]/75">{entry.text}</p>
                <time className="shrink-0 text-[10px] text-[#F8FAFC]/30">{formatTime(entry.created_at)}</time>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
