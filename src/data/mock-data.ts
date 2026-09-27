import type { AtlasMetric, MetisMetric } from "@/types"

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
