import type {
  ParsedIntent,
  ParsedTask,
  ParsedMetricUpdate,
  TaskPriority,
  MetricStatus,
} from "@/types"

interface MetricConfig {
  module: "ATLAS" | "METIS"
  label: string
  keywords: string[]
  unit: "hours" | "percent" | "text"
}

const METRIC_CONFIGS: MetricConfig[] = [
  { module: "ATLAS", label: "Sleep", keywords: ["sleep", "slept", "rested", "nap"], unit: "hours" },
  { module: "ATLAS", label: "Strain", keywords: ["strain", "exertion", "workout intensity", "effort"], unit: "text" },
  { module: "ATLAS", label: "Readiness", keywords: ["readiness", "recovery", "prepared"], unit: "percent" },
  { module: "ATLAS", label: "Hydration", keywords: ["hydration", "water", "hydrated", "fluids"], unit: "percent" },
  { module: "METIS", label: "Focus", keywords: ["focus", "concentration", "attention", "distracted"], unit: "text" },
  { module: "METIS", label: "Cognitive Load", keywords: ["cognitive load", "mental load", "brain load"], unit: "text" },
  { module: "METIS", label: "Mood", keywords: ["mood", "feeling", "emotion", "emotional"], unit: "text" },
  { module: "METIS", label: "Sensory Load", keywords: ["sensory", "overstimulated", "sensory load"], unit: "text" },
]

const TEXT_VALUES: Record<string, { value: string; status: MetricStatus }[]> = {
  Sleep: [
    { value: "5h", status: "critical" }, { value: "6h", status: "warning" },
    { value: "7h", status: "good" }, { value: "8h", status: "good" },
    { value: "9h", status: "good" },
  ],
  Strain: [
    { value: "Low", status: "good" }, { value: "Medium", status: "warning" },
    { value: "High", status: "critical" },
  ],
  Focus: [
    { value: "Sharp", status: "good" }, { value: "Steady", status: "good" },
    { value: "Drifting", status: "critical" }, { value: "Scattered", status: "critical" },
  ],
  "Cognitive Load": [
    { value: "Light", status: "good" }, { value: "Medium", status: "warning" },
    { value: "Heavy", status: "critical" },
  ],
  Mood: [
    { value: "Great", status: "good" }, { value: "Steady", status: "good" },
    { value: "Low", status: "warning" }, { value: "Poor", status: "critical" },
  ],
  "Sensory Load": [
    { value: "Low", status: "good" }, { value: "Moderate", status: "warning" },
    { value: "High", status: "critical" },
  ],
}

const PRIORITY_KEYWORDS: { priority: TaskPriority; words: string[] }[] = [
  { priority: "high", words: ["urgent", "important", "asap", "critical", "high priority"] },
  { priority: "low", words: ["low priority", "whenever", "someday", "minor"] },
]

const DUE_KEYWORDS: { due_label: string; words: string[] }[] = [
  { due_label: "Today", words: ["today", "tonight"] },
  { due_label: "Tomorrow", words: ["tomorrow"] },
  { due_label: "This Week", words: ["this week", "by friday", "by end of week"] },
  { due_label: "Next Week", words: ["next week"] },
  { due_label: "Soon", words: ["soon", "shortly"] },
]

function extractNumber(text: string, keyword: string): number | null {
  const pattern = new RegExp(`${keyword}[^0-9]*(\\d+(?:\\.\\d+)?)`, "i")
  const match = text.match(pattern)
  if (match) return parseFloat(match[1])
  return null
}

function statusFromPercent(percent: number): MetricStatus {
  if (percent >= 70) return "good"
  if (percent >= 40) return "warning"
  return "critical"
}

function statusFromSleepHours(hours: number): MetricStatus {
  if (hours >= 7) return "good"
  if (hours >= 6) return "warning"
  return "critical"
}

function parseMetricUpdate(text: string, config: MetricConfig): ParsedMetricUpdate | null {
  const lower = text.toLowerCase()
  const matched = config.keywords.some((k) => lower.includes(k))
  if (!matched) return null

  if (config.unit === "hours") {
    const hours = extractNumber(lower, config.keywords[0])
    if (hours != null) {
      return {
        module: config.module,
        label: config.label,
        value: `${hours}h`,
        status: statusFromSleepHours(hours),
        percent: Math.min(100, Math.round((hours / 8) * 100)),
      }
    }
  }

  if (config.unit === "percent") {
    const pct = extractNumber(lower, config.keywords[0])
    if (pct != null) {
      const clamped = Math.min(100, Math.max(0, Math.round(pct)))
      return {
        module: config.module,
        label: config.label,
        value: `${clamped}%`,
        status: statusFromPercent(clamped),
        percent: clamped,
      }
    }
  }

  if (config.unit === "text") {
    const options = TEXT_VALUES[config.label]
    if (options) {
      for (const opt of options) {
        if (lower.includes(opt.value.toLowerCase())) {
          return {
            module: config.module,
            label: config.label,
            value: opt.value,
            status: opt.status,
            percent: null,
          }
        }
      }
    }
  }

  return null
}

function parseTasks(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = []
  const lower = text.toLowerCase()

  const taskPatterns = [
    /(?:add|create|remind me to|new task|schedule)\s+(?:a\s+)?(?:task\s+(?:to\s+|for\s+)?)?(?:to\s+)?(.+)/i,
    /(?:i need to|i should|i have to|don't forget to|make sure i)\s+(.+)/i,
    /(?:todo|to-do):\s*(.+)/i,
  ]

  for (const pattern of taskPatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      let title = match[1].trim()
      title = title.replace(/^(?:to\s+|that\s+|the\s+)/i, "")
      title = title.charAt(0).toUpperCase() + title.slice(1)
      if (title.length < 3) continue

      let priority: TaskPriority = "medium"
      for (const pk of PRIORITY_KEYWORDS) {
        if (pk.words.some((w) => lower.includes(w))) {
          priority = pk.priority
          break
        }
      }

      let due_label = "Today"
      for (const dk of DUE_KEYWORDS) {
        if (dk.words.some((w) => lower.includes(w))) {
          due_label = dk.due_label
          break
        }
      }

      tasks.push({ title, priority, due_label })
    }
  }

  const seen = new Set<string>()
  return tasks.filter((t) => {
    const key = t.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function parseVoiceIntent(transcript: string): ParsedIntent {
  const metricUpdates: ParsedMetricUpdate[] = []
  for (const config of METRIC_CONFIGS) {
    const update = parseMetricUpdate(transcript, config)
    if (update) metricUpdates.push(update)
  }

  const tasks = parseTasks(transcript)

  return { transcript, tasks, metricUpdates }
}

export { METRIC_CONFIGS }
