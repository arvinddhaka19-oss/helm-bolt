import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Bot, CalendarDays, CheckCircle2, Cpu, ExternalLink, KeyRound, MessageCircle, PlugZap, Route, Sparkles, Unplug } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useIntegrations } from "@/hooks/use-integrations"
import type { IntegrationProvider } from "@/hooks/use-integrations"

interface IntegrationDefinition {
  id: IntegrationProvider
  name: string
  description: string
  detail: string
  authMethod: "api_key" | "oauth" | "local"
  icon: LucideIcon
  accent: string
  url?: string
}

const definitions: IntegrationDefinition[] = [
  {
    id: "claude",
    name: "Claude via MCP",
    description: "Connect Claude to H.E.L.M. tools with an MCP API key.",
    detail: "The key is held only for this browser session and is never written to dashboard data.",
    authMethod: "api_key",
    icon: Bot,
    accent: "#FFD700",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Open the multi-model gateway and manage your provider access.",
    detail: "Use OpenRouter when you want one API surface for multiple model families.",
    authMethod: "api_key",
    icon: Route,
    accent: "#00FF66",
    url: "https://openrouter.ai",
  },
  {
    id: "openai",
    name: "OpenAI Platform",
    description: "Open the OpenAI platform for API keys and model settings.",
    detail: "Manage API access separately, then use the key with your server-side model connector.",
    authMethod: "api_key",
    icon: Sparkles,
    accent: "#00FF66",
    url: "https://platform.openai.com",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Open ChatGPT for interactive conversations and custom GPTs.",
    detail: "ChatGPT is a product launcher here; API access is managed separately through OpenAI Platform.",
    authMethod: "oauth",
    icon: MessageCircle,
    accent: "#F8FAFC",
    url: "https://chatgpt.com",
  },
  {
    id: "ollama",
    name: "Ollama Local",
    description: "Use a model running on your own machine with no cloud key.",
    detail: "Start Ollama locally, then mark the local connector ready for H.E.L.M.",
    authMethod: "local",
    icon: Cpu,
    accent: "#FFD700",
    url: "http://localhost:11434",
  },
  {
    id: "google_workspace",
    name: "Google Workspace",
    description: "Connect Calendar, Drive, Gmail, and Google Docs workflows.",
    detail: "A secure Google sign-in flow is required before Workspace data can be accessed.",
    authMethod: "oauth",
    icon: CalendarDays,
    accent: "#4285F4",
    url: "https://workspace.google.com",
  },
]

function formatConnectedAt(iso: string | null): string {
  if (!iso) return "Not connected"
  return `Connected ${new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" })}`
}

export function IntegrationsPage() {
  const { connections, loading, saving, error, saveConnection, disconnect } = useIntegrations()
  const [activeProvider, setActiveProvider] = useState<IntegrationDefinition | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [accountLabel, setAccountLabel] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const connectedCount = connections.filter((connection) => connection.status === "configured").length
  const connectionMap = useMemo(
    () => new Map(connections.map((connection) => [connection.provider, connection])),
    [connections]
  )

  const openProvider = (definition: IntegrationDefinition) => {
    setNotice(null)
    if (definition.url) {
      window.open(definition.url, "_blank", "noopener,noreferrer")
    }
    if (definition.id === "claude") {
      setActiveProvider(definition)
      setApiKey("")
      setAccountLabel("")
    } else if (definition.id === "google_workspace") {
      setNotice("Google Workspace OAuth is ready for the provider sign-in step. Complete the secure sign-in setup to activate live Workspace data.")
    } else if (definition.id === "ollama") {
      void saveConnection(definition.id, definition.authMethod, "Local Ollama")
      setNotice("Ollama is marked ready for this browser. Keep the local Ollama service running when you use it.")
    }
  }

  const handleClaudeConnect = async () => {
    if (!apiKey.trim()) return
    const saved = await saveConnection("claude", "api_key", accountLabel.trim() || "Claude MCP", apiKey.trim())
    if (!saved) return
    setApiKey("")
    setAccountLabel("")
    setActiveProvider(null)
    setNotice("Claude MCP is configured for this browser session.")
  }

  const handleDisconnect = async (provider: IntegrationProvider) => {
    const removed = await disconnect(provider)
    if (removed) setNotice("Integration removed from H.E.L.M.")
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      <div className="flex flex-col gap-3 rounded-xl border border-[#0A1C14] bg-[#0A1C14]/60 p-4 sm:flex-row sm:items-end sm:justify-between md:p-6">
        <div>
          <div className="flex items-center gap-2 text-[#FFD700]">
            <PlugZap className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Integration control</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">Connect your tools</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#F8FAFC]/45">Bring model providers, local runtimes, and Workspace signals into the H.E.L.M. operating picture.</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#00FF66]/30 text-[#00FF66]">{connectedCount} connected</Badge>
      </div>

      {(error || notice) && (
        <Alert className={error ? "border-[#C8102E]/30 bg-[#C8102E]/10 text-[#F8FAFC]" : "border-[#00FF66]/20 bg-[#00FF66]/5 text-[#F8FAFC]"}>
          {error ? <Unplug className="size-4 text-[#C8102E]" /> : <CheckCircle2 className="size-4 text-[#00FF66]" />}
          <AlertTitle>{error ? "Connection issue" : "Integration update"}</AlertTitle>
          <AlertDescription className="text-[#F8FAFC]/65">{error ?? notice}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {definitions.map((definition) => {
          const connection = connectionMap.get(definition.id)
          const Icon = definition.icon
          const configured = connection?.status === "configured"

          return (
            <Card key={definition.id} className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
              <CardHeader className="gap-4 pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040D0A]" style={{ color: definition.accent }}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-[#F8FAFC]">{definition.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs leading-5 text-[#F8FAFC]/45">{definition.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={configured ? "border-[#00FF66]/30 text-[#00FF66]" : "border-[#F8FAFC]/10 text-[#F8FAFC]/40"}>
                  {configured ? "Connected" : "Available"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-xs leading-5 text-[#F8FAFC]/40">{definition.detail}</p>
                <Separator className="bg-[#F8FAFC]/5" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#F8FAFC]/30">{formatConnectedAt(connection?.last_synced_at ?? null)}</span>
                  <div className="flex flex-wrap gap-2">
                    {configured && (
                      <Button variant="ghost" size="sm" onClick={() => void handleDisconnect(definition.id)} disabled={saving} className="text-xs text-[#C8102E]/80 hover:bg-[#C8102E]/10 hover:text-[#C8102E]">
                        Disconnect
                      </Button>
                    )}
                    <Button size="sm" onClick={() => openProvider(definition)} disabled={saving} className="gap-2 bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80">
                      {definition.authMethod === "api_key" && definition.id === "claude" ? <KeyRound className="size-3.5" /> : definition.authMethod === "local" ? <Cpu className="size-3.5" /> : <ExternalLink className="size-3.5" />}
                      {configured ? "Manage" : definition.id === "google_workspace" ? "Connect" : definition.id === "ollama" ? "Use local" : definition.id === "claude" ? "Add MCP key" : "Open provider"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-[#FFD700]/20 bg-[#FFD700]/5 p-4">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-[#FFD700]" />
        <div>
          <p className="text-sm font-medium text-[#F8FAFC]/80">Credential safety</p>
          <p className="mt-1 text-xs leading-5 text-[#F8FAFC]/45">H.E.L.M. stores connection metadata only. API keys are not saved in the dashboard database, and OAuth credentials stay inside the provider authorization flow.</p>
        </div>
      </div>

      <Dialog open={activeProvider?.id === "claude"} onOpenChange={(open) => !open && setActiveProvider(null)}>
        <DialogContent className="border-[#0A1C14] bg-[#0A1C14] text-[#F8FAFC] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot className="size-5 text-[#FFD700]" /> Add Claude MCP key</DialogTitle>
            <DialogDescription className="text-[#F8FAFC]/45">Paste the key only when you are ready to use Claude in this browser session.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="claude-account" className="text-xs text-[#F8FAFC]/60">Account label (optional)</Label>
              <Input id="claude-account" value={accountLabel} onChange={(event) => setAccountLabel(event.target.value)} placeholder="Personal Claude" className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="claude-key" className="text-xs text-[#F8FAFC]/60">MCP API key</Label>
              <Input id="claude-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste your MCP API key" autoComplete="off" className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25" />
            </div>
            <p className="text-xs leading-5 text-[#F8FAFC]/35">The key is kept in memory for this session and is cleared from the form after connecting.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveProvider(null)} className="text-[#F8FAFC]/60">Cancel</Button>
            <Button onClick={() => void handleClaudeConnect()} disabled={!apiKey.trim() || saving} className="bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80">{saving ? "Connecting…" : "Connect Claude"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && <p className="text-center text-xs text-[#F8FAFC]/30">Loading integration status…</p>}
    </div>
  )
}
