export type VoiceNodeState = "idle" | "listening" | "processing" | "result"

export type TaskPriority = "low" | "medium" | "high"

export type MetricModule = "ATLAS" | "METIS"

export type MetricStatus = "good" | "warning" | "critical"

export interface Task {
  id: string
  title: string
  completed: boolean
  priority: TaskPriority
  due_label: string
  created_at: string
}

export interface AtlasMetric {
  label: string
  value: string
  status: MetricStatus
  percent?: number
}

export interface MetisMetric {
  label: string
  value: string
  status: MetricStatus
}

export interface MetricReading {
  id: string
  module: MetricModule
  label: string
  value: string
  status: MetricStatus
  percent: number | null
  created_at: string
}

export type AlertSeverity = "info" | "warning" | "critical"

export interface HelmAlert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  time: string
  created_at: string
}

export type ActivitySource = "ATLAS" | "METIS" | "KAIROS" | "HELM" | "VOICE"

export interface ActivityEntry {
  id: string
  source: ActivitySource
  text: string
  created_at: string
}

export interface ParsedMetricUpdate {
  module: MetricModule
  label: string
  value: string
  status: MetricStatus
  percent: number | null
}

export interface ParsedTask {
  title: string
  priority: TaskPriority
  due_label: string
}

export interface ParsedIntent {
  transcript: string
  tasks: ParsedTask[]
  metricUpdates: ParsedMetricUpdate[]
}
