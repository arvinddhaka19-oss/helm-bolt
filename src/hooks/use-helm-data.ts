import { useEffect, useState, useCallback } from "react"

import { supabase } from "@/lib/supabase"
import type { Task, HelmAlert } from "@/types"

export function useHelmData() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<HelmAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [tasksRes, alertsRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: true }),
      supabase.from("alerts").select("*").order("created_at", { ascending: true }),
    ])

    if (tasksRes.error) {
      setError(String(tasksRes.error.message ?? tasksRes.error))
      return
    }
    if (alertsRes.error) {
      setError(String(alertsRes.error.message ?? alertsRes.error))
      return
    }

    setTasks((tasksRes.data as Task[]) ?? [])
    setAlerts((alertsRes.data as HelmAlert[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const toggleTask = useCallback(
    async (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
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
          prev.map((t) =>
            t.id === id ? { ...t, completed: task.completed } : t
          )
        )
      }
    },
    [tasks]
  )

  return { tasks, alerts, loading, error, toggleTask, reload: loadAll }
}
