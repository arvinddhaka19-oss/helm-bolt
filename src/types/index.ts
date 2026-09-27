export type VoiceNodeState = "idle" | "listening"

export type TaskPriority = "low" | "medium" | "high"

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
  status: "good" | "warning" | "critical"
  percent?: number
}

export interface MetisMetric {
  label: string
  value: string
  status: "good" | "warning" | "critical"
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
