import type { AtlasMetric, MetisMetric, Task, HelmAlert } from "@/types"

export const atlasMetrics: AtlasMetric[] = [
  { label: "Sleep", value: "6.5h", status: "warning", percent: 65 },
  { label: "Strain", value: "High", status: "critical", percent: 85 },
  { label: "Readiness", value: "72%", status: "good", percent: 72 },
  { label: "Hydration", value: "60%", status: "warning", percent: 60 },
]

export const metisMetrics: MetisMetric[] = [
  { label: "Focus", value: "Drifting", status: "critical" },
  { label: "Cognitive Load", value: "Medium", status: "warning" },
  { label: "Mood", value: "Steady", status: "good" },
  { label: "Sensory Load", value: "Moderate", status: "warning" },
]

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Finalize Q3 Report",
    completed: false,
    priority: "high",
    dueLabel: "Today",
  },
  {
    id: "t2",
    title: "Hydrate — 500ml",
    completed: false,
    priority: "medium",
    dueLabel: "Now",
  },
  {
    id: "t3",
    title: "Reply to Jamie re: Thursday meeting",
    completed: false,
    priority: "medium",
    dueLabel: "Today",
  },
  {
    id: "t4",
    title: "LFC match prep notes",
    completed: false,
    priority: "low",
    dueLabel: "Tonight",
  },
  {
    id: "t5",
    title: "Book focus block 14:00–16:00",
    completed: false,
    priority: "high",
    dueLabel: "Today",
  },
]

export const helmAlerts: HelmAlert[] = [
  {
    id: "a1",
    title: "LFC Match vs Arsenal",
    description: "Kick-off at 20:00 — Anfield",
    severity: "critical",
    time: "20:00",
  },
]
