import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

export type McpTransport = "stdio" | "sse" | "http"
export type McpAuthType = "none" | "api_key" | "bearer" | "oauth"
export type McpStatus = "available" | "configured" | "needs_setup" | "error"

export interface McpServer {
  id: string
  name: string
  url: string
  transport: McpTransport
  auth_type: McpAuthType
  status: McpStatus
  command: string | null
  args: string[] | null
  env_keys: string[] | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface McpServerInput {
  name: string
  url: string
  transport: McpTransport
  auth_type: McpAuthType
  command?: string | null
  args?: string[] | null
  env_keys?: string[] | null
}

interface McpServerRow {
  id: string
  name: string
  url: string
  transport: McpTransport
  auth_type: McpAuthType
  status: McpStatus
  command: string | null
  args: string[] | null
  env_keys: string[] | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export function useMcpServers() {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadServers = useCallback(async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from("mcp_servers")
      .select("id, name, url, transport, auth_type, status, command, args, env_keys, last_synced_at, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (loadError) {
      setError("Could not load MCP servers. Please try again.")
      setLoading(false)
      return
    }

    setServers((data ?? []) as McpServerRow[])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadServers()
  }, [loadServers])

  const addServer = useCallback(
    async (input: McpServerInput) => {
      setSaving(true)
      const now = new Date().toISOString()
      const { error: insertError } = await supabase.from("mcp_servers").insert({
        name: input.name,
        url: input.url,
        transport: input.transport,
        auth_type: input.auth_type,
        status: "configured",
        command: input.command ?? null,
        args: input.args ?? null,
        env_keys: input.env_keys ?? null,
        last_synced_at: now,
        created_at: now,
        updated_at: now,
      })

      if (insertError) {
        setError("Could not add this MCP server. Please try again.")
        setSaving(false)
        return false
      }

      await loadServers()
      setSaving(false)
      return true
    },
    [loadServers]
  )

  const updateServer = useCallback(
    async (id: string, input: Partial<McpServerInput>) => {
      setSaving(true)
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from("mcp_servers")
        .update({ ...input, updated_at: now })
        .eq("id", id)

      if (updateError) {
        setError("Could not update this MCP server. Please try again.")
        setSaving(false)
        return false
      }

      await loadServers()
      setSaving(false)
      return true
    },
    [loadServers]
  )

  const deleteServer = useCallback(
    async (id: string) => {
      setSaving(true)
      const { error: deleteError } = await supabase.from("mcp_servers").delete().eq("id", id)

      if (deleteError) {
        setError("Could not remove this MCP server. Please try again.")
        setSaving(false)
        return false
      }

      await loadServers()
      setSaving(false)
      return true
    },
    [loadServers]
  )

  return { servers, loading, saving, error, addServer, updateServer, deleteServer, reload: loadServers }
}
