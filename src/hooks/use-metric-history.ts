import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface MetricHistoryEntry {
  id: string
  label: string
  value: string
  status: "good" | "warning" | "critical"
  percent: number | null
  created_at: string
}

export function useMetricHistory(label: string | null, limit = 30) {
  const [history, setHistory] = useState<MetricHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!label) return
    setLoading(true)
    const { data, error } = await supabase
      .from("metrics")
      .select("id, label, value, status, percent, created_at")
      .eq("label", label)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error || !data) {
      setHistory([])
      setLoading(false)
      return
    }

    setHistory(data as MetricHistoryEntry[])
    setLoading(false)
  }, [label, limit])

  useEffect(() => {
    void load()
  }, [load])

  return { history, loading, reload: load }
}
