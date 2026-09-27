import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, Loader2, CheckCircle2, Radio } from "lucide-react"

import { cn } from "@/lib/utils"

type Phase = "idle" | "listening" | "processing" | "result"

interface LogEntry {
  id: number
  text: string
  source: "ATLAS" | "METIS" | "KAIROS" | "HELM" | "VOICE"
  status: "active" | "done"
}

const SIMULATED_STEPS: { source: LogEntry["source"]; text: string }[] = [
  { source: "VOICE", text: "Transcribing audio input..." },
  { source: "HELM", text: "Parsing intent: task creation + health update" },
  { source: "ATLAS", text: "Updating sleep metric → 7.0h" },
  { source: "ATLAS", text: "Updating hydration → 65%" },
  { source: "METIS", text: "Focus recalibrated → Steady" },
  { source: "KAIROS", text: "New task added: \"Review sprint notes\"" },
  { source: "KAIROS", text: "Prioritizing: high → moved to top" },
  { source: "HELM", text: "Sync complete — 4 modules updated" },
]

const IDLE_AMBIENT: { source: LogEntry["source"]; text: string }[] = [
  { source: "ATLAS", text: "Monitoring biometrics..." },
  { source: "METIS", text: "Cognitive scan idle" },
  { source: "KAIROS", text: "Task queue stable" },
  { source: "HELM", text: "All systems nominal" },
]

const SOURCE_COLORS: Record<LogEntry["source"], string> = {
  ATLAS: "text-[#00FF66]",
  METIS: "text-[#FFD700]",
  KAIROS: "text-[#FFD700]",
  HELM: "text-[#F8FAFC]/60",
  VOICE: "text-[#FFD700]",
}

let logIdCounter = 0

export function VoiceNode() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [log, setLog] = useState<LogEntry[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [log])

  // Ambient idle log — cycles subtle system messages
  useEffect(() => {
    if (phase !== "idle") return
    let active = true

    const runAmbient = (i: number) => {
      if (!active || phase !== "idle") return
      const entry = IDLE_AMBIENT[i % IDLE_AMBIENT.length]
      const id = logIdCounter++
      setLog((prev) => [...prev.slice(-5), { id, text: entry.text, source: entry.source, status: "active" }])
      const timer = setTimeout(() => {
        if (!active) return
        setLog((prev) => prev.map((e) => (e.id === id ? { ...e, status: "done" } : e)))
        const next = setTimeout(() => runAmbient(i + 1), 3500)
        timersRef.current.push(next)
      }, 2000)
      timersRef.current.push(timer)
    }

    runAmbient(0)
    return () => {
      active = false
      clearTimers()
    }
  }, [phase, clearTimers])

  const handleMicClick = useCallback(() => {
    if (phase === "listening") {
      // Stop listening → start processing
      setPhase("processing")
      setLog([])
      clearTimers()

      SIMULATED_STEPS.forEach((step, i) => {
        const id = logIdCounter++
        const appearTimer = setTimeout(() => {
          setLog((prev) => [...prev, { id, text: step.text, source: step.source, status: "active" }])
          const doneTimer = setTimeout(() => {
            setLog((prev) => prev.map((e) => (e.id === id ? { ...e, status: "done" } : e)))
          }, 600 + Math.random() * 400)
          timersRef.current.push(doneTimer)
        }, i * 800)
        timersRef.current.push(appearTimer)
      })

      // After all steps, show result
      const resultTimer = setTimeout(() => {
        setPhase("result")
      }, SIMULATED_STEPS.length * 800 + 1200)
      timersRef.current.push(resultTimer)

      // Reset to idle after showing result
      const resetTimer = setTimeout(() => {
        setPhase("idle")
        setLog([])
      }, SIMULATED_STEPS.length * 800 + 4000)
      timersRef.current.push(resetTimer)
    } else if (phase === "idle") {
      // Start listening
      setLog([])
      setPhase("listening")
    }
  }, [phase, clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  const isListening = phase === "listening"
  const isProcessing = phase === "processing"
  const isResult = phase === "result"

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4">
      {/* Ripple rings */}
      <div className="relative flex items-center justify-center">
        {(isListening || isProcessing) && (
          <>
            <span
              className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
              style={{ animation: "helm-ripple 2s ease-out infinite" }}
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
              style={{ animation: "helm-ripple 2s ease-out infinite 0.6s" }}
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
              style={{ animation: "helm-ripple 2s ease-out infinite 1.2s" }}
            />
          </>
        )}

        {/* The button */}
        <button
          onClick={handleMicClick}
          disabled={isProcessing || isResult}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={cn(
            "relative z-10 flex size-36 items-center justify-center rounded-full transition-all duration-300 outline-none md:size-48",
            isProcessing || isResult
              ? "bg-[#0A1C14] border-2 border-[#FFD700]/40"
              : isListening
                ? "bg-[#FFD700]"
                : "bg-[#FFD700] hover:scale-105"
          )}
          style={{
            animation:
              isProcessing || isResult
                ? undefined
                : isListening
                  ? "helm-listening-glow 1.5s ease-in-out infinite"
                  : "helm-glow-pulse 3s ease-in-out infinite",
          }}
        >
          {isProcessing ? (
            <Loader2 className="size-12 animate-spin text-[#FFD700] md:size-16" strokeWidth={2.5} />
          ) : isResult ? (
            <CheckCircle2 className="size-12 text-[#00FF66] md:size-16" strokeWidth={2.5} />
          ) : (
            <Mic className="size-12 text-[#040D0A] md:size-16" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-1">
        {isListening ? (
          <>
            <p className="text-base font-semibold tracking-wide text-[#FFD700] md:text-lg">
              Listening to your update...
            </p>
            <div className="flex h-8 items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-[#FFD700]"
                  style={{
                    height: "100%",
                    transformOrigin: "center",
                    animation: `helm-wave 0.8s ease-in-out infinite ${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-[#F8FAFC]/40">
              Tap again when done
            </p>
          </>
        ) : isProcessing ? (
          <>
            <p className="text-base font-semibold tracking-wide text-[#FFD700] md:text-lg">
              Processing...
            </p>
            <p className="text-xs text-[#F8FAFC]/40">
              Updating your modules
            </p>
          </>
        ) : isResult ? (
          <>
            <p className="text-base font-semibold tracking-wide text-[#00FF66] md:text-lg">
              Sync Complete
            </p>
            <p className="text-xs text-[#F8FAFC]/40">
              4 modules updated
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium tracking-wide text-[#F8FAFC]/60">
              Tap to speak
            </p>
            <p className="text-xs tracking-wide text-[#F8FAFC]/40">
              ATLAS, METIS &amp; KAIROS are ready
            </p>
          </>
        )}
      </div>

      {/* Activity log — always visible in the center stage */}
      <div className="mt-2 flex w-full max-w-sm flex-col gap-1.5 rounded-lg border border-[#0A1C14] bg-[#040D0A]/60 p-3 md:max-w-md">
        <div className="flex items-center gap-2 border-b border-[#0A1C14] pb-1.5">
          <Radio className={cn("size-3", isListening || isProcessing ? "animate-pulse text-[#FFD700]" : "text-[#F8FAFC]/30")} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#F8FAFC]/40">
            System Activity
          </span>
        </div>
        <div className="flex h-24 flex-col gap-1 overflow-y-auto md:h-28">
          {log.length === 0 && phase === "idle" && (
            <p className="text-xs text-[#F8FAFC]/20">Awaiting input...</p>
          )}
          {log.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-2 text-xs transition-opacity duration-300",
                entry.status === "done" ? "opacity-50" : "opacity-100"
              )}
            >
              <span className={cn("shrink-0 font-mono text-[10px] font-bold", SOURCE_COLORS[entry.source])}>
                [{entry.source}]
              </span>
              <span className="text-[#F8FAFC]/70">{entry.text}</span>
              {entry.status === "active" && (
                <span className="ml-auto size-1.5 shrink-0 animate-pulse rounded-full bg-[#FFD700]" />
              )}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
