import { useState } from "react"
import { Mic } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VoiceNodeState } from "@/types"

export function VoiceNode() {
  const [state, setState] = useState<VoiceNodeState>("idle")

  const toggle = () => {
    setState((prev) => (prev === "idle" ? "listening" : "idle"))
  }

  const isListening = state === "listening"

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* Ripple rings while listening */}
        {isListening && (
          <>
            <span
              className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
              style={{
                animation: "helm-ripple 2s ease-out infinite",
              }}
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
              style={{
                animation: "helm-ripple 2s ease-out infinite 0.6s",
              }}
            />
            <span
              className="absolute inset-0 rounded-full border-2 border-[#FFD700]"
              style={{
                animation: "helm-ripple 2s ease-out infinite 1.2s",
              }}
            />
          </>
        )}

        {/* The button */}
        <button
          onClick={toggle}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={cn(
            "relative z-10 flex size-48 items-center justify-center rounded-full transition-all duration-300 outline-none",
            isListening
              ? "bg-[#FFD700]"
              : "bg-[#FFD700] hover:scale-105"
          )}
          style={{
            animation: isListening
              ? "helm-listening-glow 1.5s ease-in-out infinite"
              : "helm-glow-pulse 3s ease-in-out infinite",
          }}
        >
          {isListening ? (
            <Mic className="size-16 text-[#040D0A]" strokeWidth={2.5} />
          ) : (
            <Mic className="size-16 text-[#040D0A]" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-1">
        {isListening ? (
          <>
            <p className="text-lg font-semibold tracking-wide text-[#FFD700]">
              Listening to your update...
            </p>
            {/* Soundwave bars */}
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
    </div>
  )
}
