import { useState, useEffect } from "react"
import { Activity, LayoutDashboard, Menu, PanelsTopLeft, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { VoiceNode } from "@/components/voice-node"
import { AtlasCard } from "@/components/atlas-card"
import { MetisCard } from "@/components/metis-card"
import { KairosPanel } from "@/components/kairos-panel"
import { AlertTicker } from "@/components/alert-ticker"
import { ActivityFeed } from "@/components/activity-feed"
import { CommandOverview } from "@/components/command-overview"
import { useHelmData } from "@/hooks/use-helm-data"
import type { ParsedIntent } from "@/types"

type AppView = "overview" | "modules" | "activity"

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function App() {
  const {
    tasks,
    alerts,
    atlasMetrics,
    metisMetrics,
    activityLog,
    loading,
    toggleTask,
    processVoiceIntent,
  } = useHelmData()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState<AppView>("modules")
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const topAlert = alerts[0]

  const handleVoiceIntent = async (intent: ParsedIntent) => {
    return processVoiceIntent(intent)
  }

  return (
    <div className="flex h-svh flex-col bg-[#040D0A] text-[#F8FAFC]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-[#0A1C14] px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            size="icon"
            variant="ghost"
            className="text-[#F8FAFC] hover:bg-[#0A1C14] md:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="text-lg font-bold tracking-widest text-[#FFD700]">
            H.E.L.M.
          </h1>
          <span className="hidden text-xs text-[#F8FAFC]/30 sm:inline">
            Holistic Executive Logistics Monitor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tabular-nums text-[#F8FAFC]/60">
            {currentTime}
          </span>
          <span className="inline-block size-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
        </div>
      </header>

      {/* Mobile alert banner */}
      {topAlert && (
        <div className="flex items-center gap-2 bg-[#C8102E] px-4 py-2 md:hidden">
          <span className="size-2 shrink-0 rounded-full bg-[#F8FAFC]" />
          <span className="text-xs font-semibold text-[#F8FAFC]">
            {topAlert.title}
          </span>
          <span className="ml-auto text-xs font-bold text-[#F8FAFC]">
            {topAlert.time}
          </span>
        </div>
      )}

      <nav className="flex items-center gap-1 overflow-x-auto border-b border-[#0A1C14] px-4 py-2 md:px-6" aria-label="Primary views">
        {([
          ["modules", "Modules", PanelsTopLeft],
          ["overview", "Overview", LayoutDashboard],
          ["activity", "Activity", Activity],
        ] as const).map(([key, label, Icon]) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => setView(key)}
            className={view === key ? "gap-2 bg-[#FFD700]/10 text-[#FFD700]" : "gap-2 text-[#F8FAFC]/40 hover:bg-[#0A1C14] hover:text-[#F8FAFC]"}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </nav>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:px-6 md:py-6">
        {view === "overview" && (
          <CommandOverview
            atlasMetrics={atlasMetrics}
            metisMetrics={metisMetrics}
            tasks={tasks}
            alerts={alerts}
            activityLog={activityLog}
          />
        )}

        {view === "activity" && <ActivityFeed entries={activityLog} />}

        {view === "modules" && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[280px_1fr_320px]">
            <div className="hidden flex-col gap-4 overflow-y-auto md:flex">
              <AtlasCard metrics={atlasMetrics} />
              <MetisCard metrics={metisMetrics} />
            </div>

            <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-[#0A1C14]/30">
              {loading ? (
                <p className="text-sm text-[#F8FAFC]/40">Loading...</p>
              ) : (
                <VoiceNode
                  activityLog={activityLog}
                  processVoiceIntent={handleVoiceIntent}
                />
              )}
            </div>

            <div className="hidden min-h-0 overflow-hidden md:flex">
              <KairosPanel tasks={tasks} onToggle={toggleTask} />
            </div>
          </div>
        )}
      </main>

      {/* Alert ticker (desktop floating) */}
      <AlertTicker alerts={alerts} maxVisible={2} />

      {/* Mobile slide-over sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-[300px] flex-col gap-4 overflow-y-auto border-[#0A1C14] bg-[#040D0A] p-4"
        >
          <SheetHeader className="flex-row items-center justify-between">
            <SheetTitle className="text-[#FFD700]">Modules</SheetTitle>
            <Button
              size="icon"
              variant="ghost"
              className="text-[#F8FAFC]/60"
              onClick={() => setSheetOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            {([
              ["modules", "Modules", PanelsTopLeft],
              ["overview", "Overview", LayoutDashboard],
              ["activity", "Activity", Activity],
            ] as const).map(([key, label, Icon]) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => {
                  setView(key)
                  setSheetOpen(false)
                }}
                className={view === key ? "justify-start gap-2 bg-[#FFD700]/10 text-[#FFD700]" : "justify-start gap-2 text-[#F8FAFC]/60"}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
          <AtlasCard metrics={atlasMetrics} />
          <MetisCard metrics={metisMetrics} />
          <KairosPanel tasks={tasks} onToggle={toggleTask} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default App
