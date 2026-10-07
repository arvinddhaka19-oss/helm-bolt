import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, Loader2, CheckCircle2, Radio, MicOff, AlertCircle, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { parseVoiceIntent } from "@/lib/voice-parser"
import type { ParsedIntent, ActivityEntry } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Phase = "idle" | "listening" | "processing" | "result"

interface VoiceNodeProps {
  activityLog: ActivityEntry[]
  processVoiceIntent: (intent: ParsedIntent) => Promise<{ tasksCreated: number; metricsUpdated: number }>
}

const SOURCE_COLORS: Record<ActivityEntry["source"], string> = {
  ATLAS: "text-[#00FF66]",
  METIS: "text-[#FFD700]",
  KAIROS: "text-[#FFD700]",
  HELM: "text-[#F8FAFC]/60",
  VOICE: "text-[#FFD700]",
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

export function VoiceNode({ activityLog, processVoiceIntent }: VoiceNodeProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [resultSummary, setResultSummary] = useState("")
  const logEndRef = useRef<HTMLDivElement>(null)

  const { transcript, interimTranscript, isListening, isSupported, error, start, stop, reset } =
    useSpeechRecognition()
  const [textInput, setTextInput] = useState("")
  const [showTextInput, setShowTextInput] = useState(false)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activityLog])

  useEffect(() => {
    if (error && phase === "listening") {
      setPhase("idle")
    }
  }, [error, phase])

  const handleMicClick = useCallback(() => {
    if (phase === "idle" || error) {
      reset()
      start()
      setPhase("listening")
    } else if (phase === "listening") {
      stop()
      setPhase("processing")
    }
  }, [phase, start, stop, reset])

  const handleTextSubmit = useCallback(async () => {
    const text = textInput.trim()
    if (!text) return
    setPhase("processing")
    const intent = parseVoiceIntent(text)
    const result = await processVoiceIntent(intent)
    if (result.tasksCreated > 0 || result.metricsUpdated > 0) {
      setResultSummary(
        `${result.tasksCreated} task${result.tasksCreated !== 1 ? "s" : ""} + ${result.metricsUpdated} metric${result.metricsUpdated !== 1 ? "s" : ""} updated`
      )
    } else {
      setResultSummary("No actionable updates detected")
    }
    setPhase("result")
    setTextInput("")
    setShowTextInput(false)
    const resetTimer = setTimeout(() => {
      setPhase("idle")
      setResultSummary("")
    }, 4000)
    return () => clearTimeout(resetTimer)
  }, [textInput, processVoiceIntent])

  useEffect(() => {
    if (phase !== "listening") return
    if (!isListening && !transcript && !interimTranscript) return

    if (!isListening && transcript) {
      void (async () => {
        setPhase("processing")
        const intent = parseVoiceIntent(transcript)
        const result = await processVoiceIntent(intent)
        if (result.tasksCreated > 0 || result.metricsUpdated > 0) {
          setResultSummary(
            `${result.tasksCreated} task${result.tasksCreated !== 1 ? "s" : ""} + ${result.metricsUpdated} metric${result.metricsUpdated !== 1 ? "s" : ""} updated`
          )
        } else {
          setResultSummary("No actionable updates detected")
        }
        setPhase("result")
        reset()

        const resetTimer = setTimeout(() => {
          setPhase("idle")
          setResultSummary("")
        }, 4000)
        return () => clearTimeout(resetTimer)
      })()
    }
  }, [phase, isListening, transcript, interimTranscript, processVoiceIntent, reset])

  const fullTranscript = (transcript + " " + interimTranscript).trim()
  const isListeningUi = phase === "listening" && !error
  const isProcessing = phase === "processing"
  const isResult = phase === "result"

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4">
      {!isSupported && (
        <div className="flex items-center gap-2 rounded-lg border border-[#C8102E]/40 bg-[#C8102E]/10 px-4 py-2">
          <AlertCircle className="size-4 text-[#C8102E]" />
          <p className="text-xs text-[#F8FAFC]/70">
            Voice input not supported in this browser. Try Chrome or Edge.
          </p>
        </div>
      )}

      {error && (
        <div className="flex w-full max-w-sm flex-col gap-2 md:max-w-md">
          <div className="flex items-center gap-2 rounded-lg border border-[#C8102E]/40 bg-[#C8102E]/10 px-4 py-2">
            <AlertCircle className="size-4 shrink-0 text-[#C8102E]" />
            <p className="text-xs text-[#F8FAFC]/70">{error}</p>
          </div>
          {!showTextInput && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#0A1C14] bg-[#0A1C14] text-xs text-[#F8FAFC]/70 hover:bg-[#040D0A]"
              onClick={() => setShowTextInput(true)}
            >
              Type instead
            </Button>
          )}
        </div>
      )}

      {/* Text input fallback — shown when mic unavailable or user chooses to type */}
      {showTextInput || (!isSupported && phase === "idle") ? (
        <div className="flex w-full max-w-sm items-center gap-2 md:max-w-md">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void handleTextSubmit()
              }
            }}
            placeholder='Try: "I slept 7 hours and remind me to review notes"'
            className="border-[#0A1C14] bg-[#040D0A] text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/30"
            disabled={isProcessing || isResult}
          />
          <Button
            size="icon"
            className="shrink-0 bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80"
            onClick={() => void handleTextSubmit()}
            disabled={!textInput.trim() || isProcessing || isResult}
          >
            <Send className="size-4" />
          </Button>
        </div>
      ) : null}

      {/* Ripple rings */}
      <div className="relative flex items-center justify-center">
        {(isListeningUi || isProcessing) && (
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
          disabled={isProcessing || isResult || !isSupported}
          aria-label={isListeningUi ? "Stop listening" : "Start voice input"}
          className={cn(
            "relative z-10 flex size-36 items-center justify-center rounded-full transition-all duration-300 outline-none md:size-48",
            isProcessing || isResult
              ? "bg-[#0A1C14] border-2 border-[#FFD700]/40"
              : isListeningUi
                ? "bg-[#FFD700]"
                : "bg-[#FFD700] hover:scale-105"
          )}
          style={{
            animation:
              isProcessing || isResult
                ? undefined
                : isListeningUi
                  ? "helm-listening-glow 1.5s ease-in-out infinite"
                  : "helm-glow-pulse 3s ease-in-out infinite",
          }}
        >
          {!isSupported ? (
            <MicOff className="size-12 text-[#F8FAFC]/30 md:size-16" strokeWidth={2.5} />
          ) : isProcessing ? (
            <Loader2 className="size-12 animate-spin text-[#FFD700] md:size-16" strokeWidth={2.5} />
          ) : isResult ? (
            <CheckCircle2 className="size-12 text-[#00FF66] md:size-16" strokeWidth={2.5} />
          ) : (
            <Mic className="size-12 text-[#040D0A] md:size-16" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Status text + transcript */}
      <div className="flex min-h-[80px] flex-col items-center gap-1">
        {isListeningUi ? (
          <>
            <p className="text-base font-semibold tracking-wide text-[#FFD700] md:text-lg">
              Listening...
            </p>
            {/* Soundwave */}
            <div className="flex h-6 items-center gap-1">
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
            {/* Live transcript */}
            <div className="mt-2 min-h-[44px] max-w-sm rounded-lg border border-[#0A1C14] bg-[#040D0A]/60 px-3 py-2 md:max-w-md">
              {fullTranscript ? (
                <p className="text-sm text-[#F8FAFC]/80">
                  {fullTranscript}
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#FFD700] align-middle" />
                </p>
              ) : (
                <p className="text-xs text-[#F8FAFC]/30">Start speaking...</p>
              )}
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
              {resultSummary.includes("No actionable") ? "No Changes" : "Sync Complete"}
            </p>
            <p className="text-xs text-[#F8FAFC]/40">
              {resultSummary}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium tracking-wide text-[#F8FAFC]/60">
              Tap to speak
            </p>
            <p className="text-xs tracking-wide text-[#F8FAFC]/40">
              Say things like "I slept 7 hours" or "Remind me to review notes"
            </p>
            <button
              className="mt-1 text-[11px] text-[#FFD700]/50 underline-offset-2 hover:text-[#FFD700] hover:underline"
              onClick={() => setShowTextInput(true)}
            >
              or type your update
            </button>
          </>
        )}
      </div>

      {/* Activity log — always visible, driven by real DB entries */}
      <div className="mt-2 flex w-full max-w-sm flex-col gap-1.5 rounded-lg border border-[#0A1C14] bg-[#040D0A]/60 p-3 md:max-w-md">
        <div className="flex items-center gap-2 border-b border-[#0A1C14] pb-1.5">
          <Radio className={cn("size-3", isListeningUi || isProcessing ? "animate-pulse text-[#FFD700]" : "text-[#F8FAFC]/30")} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#F8FAFC]/40">
            System Activity
          </span>
        </div>
        <div className="flex h-24 flex-col gap-1 overflow-y-auto md:h-32">
          {activityLog.length === 0 ? (
            <p className="text-xs text-[#F8FAFC]/20">No activity yet...</p>
          ) : (
            [...activityLog].reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-xs"
              >
                <span className={cn("shrink-0 font-mono text-[10px] font-bold", SOURCE_COLORS[entry.source])}>
                  [{entry.source}]
                </span>
                <span className="flex-1 text-[#F8FAFC]/70">{entry.text}</span>
                <span className="shrink-0 text-[10px] text-[#F8FAFC]/20">
                  {formatTimeAgo(entry.created_at)}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
