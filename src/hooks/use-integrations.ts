import { useCallback, useEffect, useRef, useState } from "react"

import { supabase } from "@/lib/supabase"

export type IntegrationProvider = "claude" | "openrouter" | "openai" | "chatgpt" | "ollama" | "google_workspace"
export type IntegrationStatus = "available" | "configured" | "needs_setup"

export interface IntegrationConnection {
  provider: IntegrationProvider
  status: IntegrationStatus
  auth_method: "api_key" | "oauth" | "local"
  account_label: string | null
  last_synced_at: string | null
}

interface ConnectionRow {
  provider: IntegrationProvider
  status: IntegrationStatus
  auth_method: IntegrationConnection["auth_method"]
  account_label: string | null
  last_synced_at: string | null
}

export function useIntegrations() {
  const [connections, setConnections] = useState<IntegrationConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionSecrets = useRef<Partial<Record<IntegrationProvider, string>>>({})

  const loadConnections = useCallback(async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from("integration_connections")
      .select("provider, status, auth_method, account_label, last_synced_at")
      .order("provider")

    if (loadError) {
      setError("Could not load integrations. Please try again.")
      setLoading(false)
      return
    }

    setConnections((data ?? []) as ConnectionRow[])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadConnections()
  }, [loadConnections])

  const saveConnection = useCallback(
    async (provider: IntegrationProvider, authMethod: IntegrationConnection["auth_method"], accountLabel: string | null, secret?: string) => {
      if (secret) sessionSecrets.current[provider] = secret
      setSaving(true)
      const now = new Date().toISOString()
      const { error: saveError } = await supabase.from("integration_connections").upsert(
        {
          provider,
          status: "configured",
          auth_method: authMethod,
          account_label: accountLabel,
          last_synced_at: now,
          updated_at: now,
        },
        { onConflict: "provider" }
      )

      if (saveError) {
        setError("Could not save this integration. Please try again.")
        setSaving(false)
        return false
      }

      await loadConnections()
      setSaving(false)
      return true
    },
    [loadConnections]
  )

  const disconnect = useCallback(
    async (provider: IntegrationProvider) => {
      delete sessionSecrets.current[provider]
      setSaving(true)
      const { error: deleteError } = await supabase
        .from("integration_connections")
        .delete()
        .eq("provider", provider)

      if (deleteError) {
        setError("Could not remove this integration. Please try again.")
        setSaving(false)
        return false
      }

      await loadConnections()
      setSaving(false)
      return true
    },
    [loadConnections]
  )

  return { connections, loading, saving, error, saveConnection, disconnect, reload: loadConnections }
}
