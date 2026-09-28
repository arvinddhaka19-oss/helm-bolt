import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { VoiceNode } from "@/components/voice-node"
import { AtlasCard } from "@/components/atlas-card"
import { MetisCard } from "@/components/metis-card"
import { KairosPanel } from "@/components/kairos-panel"
import { AlertTicker } from "@/components/alert-ticker"
import { useHelmData } from "@/hooks/use-helm-data"
import type { ParsedIntent } from "@/types"

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

      {/* Main content grid */}
      <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 md:grid-cols-[280px_1fr_320px] md:px-6 md:py-6">
        {/* Left column — ATLAS & METIS (hidden on mobile) */}
        <div className="hidden flex-col gap-4 overflow-y-auto md:flex">
          <AtlasCard metrics={atlasMetrics} />
          <MetisCard metrics={metisMetrics} />
        </div>

        {/* Center stage — Voice Node */}
        <div className="flex items-center justify-center overflow-hidden rounded-xl bg-[#0A1C14]/30">
          {loading ? (
            <p className="text-sm text-[#F8FAFC]/40">Loading...</p>
          ) : (
            <VoiceNode
              activityLog={activityLog}
              processVoiceIntent={handleVoiceIntent}
            />
          )}
        </div>

        {/* Right column — KAIROS (hidden on mobile) */}
        <div className="hidden overflow-hidden md:flex">
          <KairosPanel tasks={tasks} onToggle={toggleTask} />
        </div>
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
          <AtlasCard metrics={atlasMetrics} />
          <MetisCard metrics={metisMetrics} />
          <KairosPanel tasks={tasks} onToggle={toggleTask} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default App
