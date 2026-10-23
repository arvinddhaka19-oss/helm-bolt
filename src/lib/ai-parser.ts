import type { ParsedIntent } from "@/types"
import { parseVoiceIntent as localParse } from "@/lib/voice-parser"
import { supabase } from "@/lib/supabase"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

type Provider = "claude" | "chatgpt" | "openai" | "gemini" | "perplexity" | "mistral" | "groq" | "anthropic_api" | "cohere" | "openrouter" | "ollama" | "google"

interface StoredConnection {
  provider: Provider
  auth_method: string
  account_label: string | null
}

const apiKeyMemory: Partial<Record<string, string>> = {}

export function storeApiKey(provider: string, key: string) {
  apiKeyMemory[provider] = key
}

export function getStoredApiKey(provider: string): string | undefined {
  return apiKeyMemory[provider]
}

export function hasApiKey(provider: string): boolean {
  return !!apiKeyMemory[provider]
}

async function findConnectionWithKey(): Promise<{ provider: string; apiKey: string } | null> {
  const { data, error } = await supabase
    .from("integration_connections")
    .select("provider, auth_method, account_label")
    .eq("status", "configured")

  if (error || !data || data.length === 0) return null

  const connections = data as StoredConnection[]
  const apiProviders = ["claude", "openai", "anthropic_api", "gemini", "groq", "openrouter", "mistral", "perplexity", "cohere"]
  for (const conn of connections) {
    if (apiProviders.includes(conn.provider)) {
      const key = apiKeyMemory[conn.provider]
      if (key) return { provider: conn.provider, apiKey: key }
    }
  }
  return null
}

export async function parseIntentWithAI(transcript: string): Promise<ParsedIntent & { model?: string }> {
  const connection = await findConnectionWithKey()
  if (!connection) {
    return localParse(transcript)
  }

  try {
    const url = `${SUPABASE_URL}/functions/v1/ai-parse-intent`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        transcript,
        provider: connection.provider,
        apiKey: connection.apiKey,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => "")
      console.warn("AI parse failed, falling back:", res.status, errBody)
      return localParse(transcript)
    }

    const data = await res.json()
    if (data.error) {
      console.warn("AI parse returned error:", data.error)
      return localParse(transcript)
    }

    return {
      transcript,
      tasks: data.tasks ?? [],
      metricUpdates: data.metricUpdates ?? [],
      model: data.model,
    }
  } catch (err) {
    console.warn("AI parse threw, falling back:", err)
    return localParse(transcript)
  }
}
