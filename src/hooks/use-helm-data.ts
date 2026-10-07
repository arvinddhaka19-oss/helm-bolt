import { useEffect, useState, useCallback } from "react"

import { supabase } from "@/lib/supabase"
import type {
  Task,
  HelmAlert,
  MetricReading,
  ActivityEntry,
  AtlasMetric,
  MetisMetric,
  ParsedIntent,

} from "@/types"

function readingToAtlasMetric(r: MetricReading): AtlasMetric {
  return { label: r.label, value: r.value, status: r.status, percent: r.percent ?? undefined }
}

function readingToMetisMetric(r: MetricReading): MetisMetric {
  return { label: r.label, value: r.value, status: r.status }
}

export function useHelmData() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<HelmAlert[]>([])
  const [atlasMetrics, setAtlasMetrics] = useState<AtlasMetric[]>([])
  const [metisMetrics, setMetisMetrics] = useState<MetisMetric[]>([])
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [tasksRes, alertsRes, metricsRes, logRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: true }),
      supabase.from("alerts").select("*").order("created_at", { ascending: true }),
      supabase.from("metrics").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50),
    ])

    if (tasksRes.error) { setError(String(tasksRes.error.message ?? tasksRes.error)); return }
    if (alertsRes.error) { setError(String(alertsRes.error.message ?? alertsRes.error)); return }
    if (metricsRes.error) { setError(String(metricsRes.error.message ?? metricsRes.error)); return }
    if (logRes.error) { setError(String(logRes.error.message ?? logRes.error)); return }

    setTasks((tasksRes.data as Task[]) ?? [])
    setAlerts((alertsRes.data as HelmAlert[]) ?? [])

    const allMetrics = (metricsRes.data as MetricReading[]) ?? []
    const latestByLabel = new Map<string, MetricReading>()
    for (const m of allMetrics) {
      if (!latestByLabel.has(m.label)) {
        latestByLabel.set(m.label, m)
      }
    }
    const atlas = Array.from(latestByLabel.values())
      .filter((m) => m.module === "ATLAS")
      .map(readingToAtlasMetric)
    const metis = Array.from(latestByLabel.values())
      .filter((m) => m.module === "METIS")
      .map(readingToMetisMetric)
    setAtlasMetrics(atlas)
    setMetisMetrics(metis)

    setActivityLog(((logRes.data as ActivityEntry[]) ?? []).reverse())

    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const toggleTask = useCallback(
    async (id: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      )
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", id)
      if (updateError) {
        setError(updateError.message)
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t))
        )
      }
    },
    [tasks]
  )

  const addActivityEntry = useCallback(async (source: ActivityEntry["source"], text: string) => {
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      source,
      text,
      created_at: new Date().toISOString(),
    }
    setActivityLog((prev) => [...prev.slice(-49), entry])

    const { error: insertError } = await supabase
      .from("activity_log")
      .insert({ source, text })
    if (insertError) {
      setError(insertError.message)
    }
  }, [])

  const processVoiceIntent = useCallback(
    async (intent: ParsedIntent): Promise<{ tasksCreated: number; metricsUpdated: number }> => {
      let tasksCreated = 0
      let metricsUpdated = 0

      if (intent.transcript.trim()) {
        void addActivityEntry("VOICE", `Heard: "${intent.transcript.trim()}"`)
      }

      if (intent.tasks.length > 0) {
        void addActivityEntry("HELM", `Parsing intent: ${intent.tasks.length} task(s) + ${intent.metricUpdates.length} metric update(s)`)
      } else if (intent.metricUpdates.length > 0) {
        void addActivityEntry("HELM", `Parsing intent: ${intent.metricUpdates.length} metric update(s)`)
      }

      for (const task of intent.tasks) {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: task.title,
          priority: task.priority,
          due_label: task.due_label,
          completed: false,
          created_at: new Date().toISOString(),
        }
        setTasks((prev) => [...prev, newTask])
        tasksCreated++
        void supabase
          .from("tasks")
          .insert({
            id: newTask.id,
            title: newTask.title,
            priority: newTask.priority,
            due_label: newTask.due_label,
          })
          .then(({ error: insertError }) => {
            if (insertError) {
              setError(insertError.message)
              setTasks((prev) => prev.filter((item) => item.id !== newTask.id))
            }
          })
        void addActivityEntry("KAIROS", `New task added: "${task.title}" (${task.priority})`)
      }

      for (const update of intent.metricUpdates) {
        metricsUpdated++
        void supabase
          .from("metrics")
          .insert({
            module: update.module,
            label: update.label,
            value: update.value,
            status: update.status,
            percent: update.percent,
          })
          .then(({ error: insertError }) => {
            if (insertError) {
              setError(insertError.message)
            }
          })
        void addActivityEntry(update.module as ActivityEntry["source"], `Updated ${update.label} → ${update.value}`)

        if (update.module === "ATLAS") {
          setAtlasMetrics((prev) => {
            const idx = prev.findIndex((m) => m.label === update.label)
            if (idx === -1) {
              return [...prev, { label: update.label, value: update.value, status: update.status, percent: update.percent ?? undefined }]
            }
            const next = [...prev]
            next[idx] = { label: update.label, value: update.value, status: update.status, percent: update.percent ?? undefined }
            return next
          })
        } else {
          setMetisMetrics((prev) => {
            const idx = prev.findIndex((m) => m.label === update.label)
            if (idx === -1) {
              return [...prev, { label: update.label, value: update.value, status: update.status }]
            }
            const next = [...prev]
            next[idx] = { label: update.label, value: update.value, status: update.status }
            return next
          })
        }
      }

      if (tasksCreated > 0 || metricsUpdated > 0) {
        void addActivityEntry("HELM", `Sync complete — ${tasksCreated} task(s) + ${metricsUpdated} metric(s) updated`)
      } else if (intent.transcript.trim()) {
        void addActivityEntry("HELM", "No actionable updates detected in speech")
      }

      return { tasksCreated, metricsUpdated }
    },
    [addActivityEntry]
  )

  return {
    tasks,
    alerts,
    atlasMetrics,
    metisMetrics,
    activityLog,
    loading,
    error,
    toggleTask,
    reload: loadAll,
    processVoiceIntent,
  }
}
