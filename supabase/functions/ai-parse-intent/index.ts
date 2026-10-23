import { createClient } from "npm:@supabase/supabase-js@2.45.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

if (Deno.env.get("DENO_ENV") === "test") {
  // noop
}

interface ParseRequest {
  transcript: string
  provider?: string
  apiKey?: string
  model?: string
}

interface ParsedMetricUpdate {
  module: "ATLAS" | "METIS"
  label: string
  value: string
  status: "good" | "warning" | "critical"
  percent: number | null
}

interface ParsedTask {
  title: string
  priority: "low" | "medium" | "high"
  due_label: string
}

interface ParseResponse {
  transcript: string
  tasks: ParsedTask[]
  metricUpdates: ParsedMetricUpdate[]
  model?: string
}

const SYSTEM_PROMPT = `You are the intent parser for H.E.L.M., a personal executive logistics monitor.
The user speaks or types a natural-language update. You must extract structured data from it.

Extract two kinds of things:

1. METRIC UPDATES — if the user mentions anything about:
   - ATLAS (body metrics): Sleep (hours, e.g. "7h"), Strain (Low/Medium/High), Readiness (0-100 percent), Hydration (0-100 percent)
   - METIS (mind metrics): Focus (Sharp/Steady/Drifting/Scattered), Cognitive Load (Light/Medium/Heavy), Mood (Great/Steady/Low/Poor), Sensory Load (Low/Moderate/High)
   Set status based on value: good (optimal), warning (suboptimal), critical (poor).
   For Sleep: >=7h good, >=6h warning, <6h critical. For percent metrics: >=70 good, >=40 warning, <40 critical.
   For text metrics: pick the closest matching text value from the allowed options.

2. TASKS — if the user mentions anything they need to do, create a task:
   - title: a short imperative phrase (capitalize first letter)
   - priority: "high" if urgent/important/asap/critical, "low" if low priority/whenever/someday, "medium" otherwise
   - due_label: "Today", "Tomorrow", "This Week", "Next Week", or "Soon" based on context

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "tasks": [{ "title": "...", "priority": "...", "due_label": "..." }],
  "metricUpdates": [{ "module": "ATLAS", "label": "Sleep", "value": "7h", "status": "good", "percent": 88 }]
}

If no tasks or metrics are detected, return empty arrays. Be conservative — only extract what's clearly stated.`

function getProviderConfig(provider: string, apiKey: string, model?: string): { url: string; model: string; headers: Record<string, string> } | null {
  switch (provider) {
    case "claude":
    case "anthropic_api": {
      return {
        url: "https://api.anthropic.com/v1/messages",
        model: model || "claude-sonnet-4-20250514",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      }
    }
    case "openai":
    case "chatgpt": {
      return {
        url: "https://api.openai.com/v1/chat/completions",
        model: model || "gpt-4o-mini",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      }
    }
    case "gemini": {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-flash"}:generateContent?key=${apiKey}`,
        model: model || "gemini-1.5-flash",
        headers: { "content-type": "application/json" },
      }
    }
    case "groq": {
      return {
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: model || "llama-3.3-70b-versatile",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      }
    }
    case "openrouter": {
      return {
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: model || "anthropic/claude-3.5-sonnet",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      }
    }
    case "mistral": {
      return {
        url: "https://api.mistral.ai/v1/chat/completions",
        model: model || "mistral-small-latest",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      }
    }
    case "perplexity": {
      return {
        url: "https://api.perplexity.ai/chat/completions",
        model: model || "llama-3.1-sonar-small-128k-online",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      }
    }
    case "cohere": {
      return {
        url: "https://api.cohere.ai/v2/chat",
        model: model || "command-r-plus",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      }
    }
    default:
      return null
  }
}

async function callAnthropic(config: { url: string; model: string; headers: Record<string, string> }, transcript: string): Promise<string> {
  const body = {
    model: config.model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: transcript }],
  }
  const res = await fetch(config.url, { method: "POST", headers: config.headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Provider error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ""
}

async function callOpenAICompatible(config: { url: string; model: string; headers: Record<string, string> }, transcript: string): Promise<string> {
  const body = {
    model: config.model,
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
  }
  const res = await fetch(config.url, { method: "POST", headers: config.headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Provider error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}

async function callGemini(config: { url: string; model: string; headers: Record<string, string> }, transcript: string): Promise<string> {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: transcript }] }],
    generationConfig: { maxOutputTokens: 1024 },
  }
  const res = await fetch(config.url, { method: "POST", headers: config.headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Provider error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

async function callCohere(config: { url: string; model: string; headers: Record<string, string> }, transcript: string): Promise<string> {
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
  }
  const res = await fetch(config.url, { method: "POST", headers: config.headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Provider error: ${res.status}`)
  const data = await res.json()
  return data.message?.content?.[0]?.text ?? ""
}

function extractJson(text: string): ParseResponse | null {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(cleaned)
    if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.metricUpdates)) {
      return parsed as ParseResponse
    }
  } catch {
    // Try to find a JSON block
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.metricUpdates)) {
          return parsed as ParseResponse
        }
      } catch {
        // fall through
      }
    }
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json() as ParseRequest
    const { transcript, provider, apiKey, model } = body

    if (!transcript?.trim()) {
      return new Response(
        JSON.stringify({ error: "Transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Provider and API key are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const config = getProviderConfig(provider, apiKey, model)
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let rawText = ""
    if (provider === "claude" || provider === "anthropic_api") {
      rawText = await callAnthropic(config, transcript)
    } else if (provider === "gemini") {
      rawText = await callGemini(config, transcript)
    } else if (provider === "cohere") {
      rawText = await callCohere(config, transcript)
    } else {
      rawText = await callOpenAICompatible(config, transcript)
    }

    const parsed = extractJson(rawText)
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Could not parse AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const response: ParseResponse = {
      transcript,
      tasks: parsed.tasks,
      metricUpdates: parsed.metricUpdates,
      model: config.model,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
