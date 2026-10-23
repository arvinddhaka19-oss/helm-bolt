import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Bot,
  Brain,
  CalendarDays,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Globe,
  KeyRound,
  MessageCircle,
  Pencil,
  PlugZap,
  Plus,
  Route,
  Server,
  Sparkles,
  Trash2,
  Unplug,
  Zap,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useIntegrations } from "@/hooks/use-integrations"
import type { IntegrationProvider } from "@/hooks/use-integrations"
import { useMcpServers } from "@/hooks/use-mcp-servers"
import type { McpAuthType, McpTransport } from "@/hooks/use-mcp-servers"

interface IntegrationDefinition {
  id: IntegrationProvider
  name: string
  description: string
  detail: string
  authMethod: "api_key" | "oauth" | "local"
  icon: LucideIcon
  accent: string
  url?: string
  keyUrl?: string
}

const definitions: IntegrationDefinition[] = [
  {
    id: "google",
    name: "Google Account",
    description: "Connect your Google account for Calendar, Drive, Gmail, and Docs.",
    detail: "Sign in with Google to let H.E.L.M. access your Workspace data on your behalf.",
    authMethod: "oauth",
    icon: CalendarDays,
    accent: "#4285F4",
    url: "https://accounts.google.com",
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    description: "Connect Claude with an Anthropic API key or MCP key.",
    detail: "Paste your Anthropic API key to enable Claude model access in H.E.L.M.",
    authMethod: "api_key",
    icon: Bot,
    accent: "#FFD700",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "chatgpt",
    name: "ChatGPT (OpenAI)",
    description: "Connect your ChatGPT account for conversations and custom GPTs.",
    detail: "Sign in to your ChatGPT account to link it with H.E.L.M.",
    authMethod: "oauth",
    icon: MessageCircle,
    accent: "#F8FAFC",
    url: "https://chatgpt.com",
  },
  {
    id: "openai",
    name: "OpenAI Platform",
    description: "Manage API keys and model access on the OpenAI platform.",
    detail: "Use an OpenAI API key for direct model access from H.E.L.M.",
    authMethod: "api_key",
    icon: Sparkles,
    accent: "#00FF66",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Connect Google Gemini for multimodal AI capabilities.",
    detail: "Paste your Gemini API key from Google AI Studio to enable Gemini models.",
    authMethod: "api_key",
    icon: Globe,
    accent: "#4285F4",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    description: "Connect Perplexity for AI-powered search and answers.",
    detail: "Use a Perplexity API key for search-augmented responses.",
    authMethod: "api_key",
    icon: Sparkles,
    accent: "#00FF66",
    keyUrl: "https://www.perplexity.ai/settings/api",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Connect Mistral for European-hosted open and commercial models.",
    detail: "Paste your Mistral API key from the Mistral platform.",
    authMethod: "api_key",
    icon: Brain,
    accent: "#FFD700",
    keyUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference for open-source models via Groq.",
    detail: "Use a Groq API key for lightning-fast model responses.",
    authMethod: "api_key",
    icon: Zap,
    accent: "#F8FAFC",
    keyUrl: "https://console.groq.com/keys",
  },
  {
    id: "anthropic_api",
    name: "Anthropic API",
    description: "Direct Anthropic API access for Claude models.",
    detail: "Use a separate Anthropic API key if you prefer direct API access over MCP.",
    authMethod: "api_key",
    icon: Bot,
    accent: "#FFD700",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Connect Cohere for language models, embeddings, and reranking.",
    detail: "Paste your Cohere API key from the Cohere dashboard.",
    authMethod: "api_key",
    icon: Brain,
    accent: "#00FF66",
    keyUrl: "https://dashboard.cohere.com/api-keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "One API surface for multiple model families.",
    detail: "Use an OpenRouter key to access many providers through a single endpoint.",
    authMethod: "api_key",
    icon: Route,
    accent: "#00FF66",
    keyUrl: "https://openrouter.ai/keys",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Run models on your own machine with no cloud key.",
    detail: "Start Ollama locally, then mark the connector ready for H.E.L.M.",
    authMethod: "local",
    icon: Cpu,
    accent: "#FFD700",
    url: "http://localhost:11434",
  },
]

function formatConnectedAt(iso: string | null): string {
  if (!iso) return "Not connected"
  return `Connected ${new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" })}`
}

type ApiKeyDialogState = { definition: IntegrationDefinition } | null

export function IntegrationsPage() {
  const { connections, loading, saving, error, saveConnection, disconnect } = useIntegrations()
  const { servers, saving: mcpSaving, error: mcpError, addServer, updateServer, deleteServer } = useMcpServers()
  const [apiKeyDialog, setApiKeyDialog] = useState<ApiKeyDialogState>(null)
  const [apiKey, setApiKey] = useState("")
  const [accountLabel, setAccountLabel] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const [mcpDialogOpen, setMcpDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<string | null>(null)
  const [mcpName, setMcpName] = useState("")
  const [mcpUrl, setMcpUrl] = useState("")
  const [mcpTransport, setMcpTransport] = useState<McpTransport>("http")
  const [mcpAuthType, setMcpAuthType] = useState<McpAuthType>("none")
  const [mcpCommand, setMcpCommand] = useState("")
  const [mcpArgs, setMcpArgs] = useState("")
  const [mcpEnvKeys, setMcpEnvKeys] = useState("")

  const connectedCount = connections.filter((c) => c.status === "configured").length
  const connectionMap = useMemo(
    () => new Map(connections.map((c) => [c.provider, c])),
    [connections]
  )

  const resetMcpForm = () => {
    setMcpName("")
    setMcpUrl("")
    setMcpTransport("http")
    setMcpAuthType("none")
    setMcpCommand("")
    setMcpArgs("")
    setMcpEnvKeys("")
    setEditingServer(null)
  }

  const openProvider = (definition: IntegrationDefinition) => {
    setNotice(null)
    if (definition.authMethod === "api_key") {
      setApiKeyDialog({ definition })
      setApiKey("")
      setAccountLabel("")
    } else if (definition.authMethod === "oauth") {
      if (definition.url) window.open(definition.url, "_blank", "noopener,noreferrer")
      void saveConnection(definition.id, "oauth", definition.name)
      setNotice(`${definition.name} sign-in opened in a new tab. Complete authorization there to connect your account.`)
    } else if (definition.authMethod === "local") {
      void saveConnection(definition.id, "local", "Local Ollama")
      setNotice("Ollama is marked ready for this browser. Keep the local Ollama service running.")
    }
  }

  const handleApiKeyConnect = async () => {
    if (!apiKeyDialog || !apiKey.trim()) return
    const def = apiKeyDialog.definition
    const saved = await saveConnection(def.id, "api_key", accountLabel.trim() || def.name, apiKey.trim())
    if (!saved) return
    setApiKey("")
    setAccountLabel("")
    setApiKeyDialog(null)
    setNotice(`${def.name} is now connected.`)
  }

  const handleDisconnect = async (provider: IntegrationProvider) => {
    const removed = await disconnect(provider)
    if (removed) setNotice("Integration removed from H.E.L.M.")
  }

  const handleMcpSubmit = async () => {
    if (!mcpName.trim() || !mcpUrl.trim()) return

    const argsArray = mcpArgs
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
    const envKeysArray = mcpEnvKeys
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)

    const input = {
      name: mcpName.trim(),
      url: mcpUrl.trim(),
      transport: mcpTransport,
      auth_type: mcpAuthType,
      command: mcpTransport === "stdio" ? mcpCommand.trim() || null : null,
      args: argsArray.length > 0 ? argsArray : null,
      env_keys: envKeysArray.length > 0 ? envKeysArray : null,
    }

    if (editingServer) {
      const ok = await updateServer(editingServer, input)
      if (ok) {
        setMcpDialogOpen(false)
        resetMcpForm()
        setNotice("MCP server updated.")
      }
    } else {
      const ok = await addServer(input)
      if (ok) {
        setMcpDialogOpen(false)
        resetMcpForm()
        setNotice("MCP server added.")
      }
    }
  }

  const openEditMcp = (id: string) => {
    const server = servers.find((s) => s.id === id)
    if (!server) return
    setEditingServer(id)
    setMcpName(server.name)
    setMcpUrl(server.url)
    setMcpTransport(server.transport)
    setMcpAuthType(server.auth_type)
    setMcpCommand(server.command ?? "")
    setMcpArgs((server.args ?? []).join("\n"))
    setMcpEnvKeys((server.env_keys ?? []).join(", "))
    setMcpDialogOpen(true)
  }

  const openAddMcp = () => {
    resetMcpForm()
    setMcpDialogOpen(true)
  }

  const handleDeleteMcp = async (id: string) => {
    const ok = await deleteServer(id)
    if (ok) setNotice("MCP server removed.")
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
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#F8FAFC]/45">
            Bring AI accounts, model providers, local runtimes, and custom MCP servers into the H.E.L.M. operating picture.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-[#00FF66]/30 text-[#00FF66]">
          {connectedCount} connected
        </Badge>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="border-[#0A1C14] bg-[#0A1C14]">
          <TabsTrigger value="integrations" className="data-[state=active]:text-[#FFD700]">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="mcp" className="data-[state=active]:text-[#FFD700]">
            MCP Servers
          </TabsTrigger>
        </TabsList>

        {/* --- Integrations tab --- */}
        <TabsContent value="integrations" className="flex flex-col gap-4">
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
                    <Badge
                      variant="outline"
                      className={configured ? "border-[#00FF66]/30 text-[#00FF66]" : "border-[#F8FAFC]/10 text-[#F8FAFC]/40"}
                    >
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDisconnect(definition.id)}
                            disabled={saving}
                            className="text-xs text-[#C8102E]/80 hover:bg-[#C8102E]/10 hover:text-[#C8102E]"
                          >
                            Disconnect
                          </Button>
                        )}
                        {definition.keyUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(definition.keyUrl, "_blank", "noopener,noreferrer")}
                            className="gap-1.5 text-xs text-[#F8FAFC]/40 hover:text-[#F8FAFC]/70"
                          >
                            <ExternalLink className="size-3" />
                            Get key
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => openProvider(definition)}
                          disabled={saving}
                          className="gap-2 bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80"
                        >
                          {definition.authMethod === "api_key" ? (
                            <KeyRound className="size-3.5" />
                          ) : definition.authMethod === "local" ? (
                            <Cpu className="size-3.5" />
                          ) : (
                            <ExternalLink className="size-3.5" />
                          )}
                          {configured ? "Manage" : definition.authMethod === "oauth" ? "Connect" : definition.authMethod === "local" ? "Use local" : "Add key"}
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
              <p className="mt-1 text-xs leading-5 text-[#F8FAFC]/45">
                H.E.L.M. stores connection metadata only. API keys are held in your browser session memory and are never
                written to the dashboard database. OAuth credentials stay inside the provider's authorization flow.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* --- MCP Servers tab --- */}
        <TabsContent value="mcp" className="flex flex-col gap-4">
          {(mcpError || notice) && (
            <Alert className={mcpError ? "border-[#C8102E]/30 bg-[#C8102E]/10 text-[#F8FAFC]" : "border-[#00FF66]/20 bg-[#00FF66]/5 text-[#F8FAFC]"}>
              {mcpError ? <Unplug className="size-4 text-[#C8102E]" /> : <CheckCircle2 className="size-4 text-[#00FF66]" />}
              <AlertTitle>{mcpError ? "MCP error" : "MCP update"}</AlertTitle>
              <AlertDescription className="text-[#F8FAFC]/65">{mcpError ?? notice}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F8FAFC]">
                <Server className="size-5 text-[#FFD700]" />
                Custom MCP Servers
              </h3>
              <p className="mt-1 text-sm text-[#F8FAFC]/45">
                Add and manage Model Context Protocol servers for custom tool integrations.
              </p>
            </div>
            <Button
              size="sm"
              onClick={openAddMcp}
              disabled={mcpSaving}
              className="gap-2 bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80"
            >
              <Plus className="size-4" />
              Add MCP
            </Button>
          </div>

          {servers.length === 0 ? (
            <Card className="border-dashed border-[#0A1C14] bg-[#0A1C14]/40">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Server className="size-8 text-[#F8FAFC]/20" />
                <p className="text-sm text-[#F8FAFC]/40">No MCP servers configured yet.</p>
                <p className="max-w-sm text-xs text-[#F8FAFC]/30">
                  Add a custom MCP server to connect external tools, data sources, or APIs through the Model Context Protocol.
                </p>
                <Button size="sm" onClick={openAddMcp} className="mt-1 gap-2 bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80">
                  <Plus className="size-4" />
                  Add your first MCP
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {servers.map((server) => (
                <Card key={server.id} className="border-[#0A1C14] bg-[#0A1C14] shadow-lg shadow-black/20">
                  <CardHeader className="gap-4 pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040D0A] text-[#FFD700]">
                        <Server className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-[#F8FAFC]">{server.name}</CardTitle>
                        <CardDescription className="mt-1 break-all text-xs leading-5 text-[#F8FAFC]/45">
                          {server.url}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        server.status === "configured"
                          ? "border-[#00FF66]/30 text-[#00FF66]"
                          : server.status === "error"
                            ? "border-[#C8102E]/30 text-[#C8102E]"
                            : "border-[#F8FAFC]/10 text-[#F8FAFC]/40"
                      }
                    >
                      {server.status === "configured" ? "Active" : server.status === "error" ? "Error" : "Pending"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-[#F8FAFC]/10 text-[10px] uppercase text-[#F8FAFC]/40">
                        {server.transport}
                      </Badge>
                      <Badge variant="outline" className="border-[#F8FAFC]/10 text-[10px] uppercase text-[#F8FAFC]/40">
                        {server.auth_type}
                      </Badge>
                    </div>
                    <Separator className="bg-[#F8FAFC]/5" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#F8FAFC]/30">{formatConnectedAt(server.last_synced_at)}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMcp(server.id)}
                          disabled={mcpSaving}
                          className="gap-1.5 text-xs text-[#F8FAFC]/60 hover:bg-[#040D0A] hover:text-[#F8FAFC]"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDeleteMcp(server.id)}
                          disabled={mcpSaving}
                          className="gap-1.5 text-xs text-[#C8102E]/80 hover:bg-[#C8102E]/10 hover:text-[#C8102E]"
                        >
                          <Trash2 className="size-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* --- API key dialog --- */}
      <Dialog open={apiKeyDialog !== null} onOpenChange={(open) => !open && setApiKeyDialog(null)}>
        <DialogContent className="border-[#0A1C14] bg-[#0A1C14] text-[#F8FAFC] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {apiKeyDialog && (() => {
                const Icon = apiKeyDialog.definition.icon
                return <Icon className="size-5 text-[#FFD700]" />
              })()}
              Connect {apiKeyDialog?.definition.name}
            </DialogTitle>
            <DialogDescription className="text-[#F8FAFC]/45">
              {apiKeyDialog?.definition.detail}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="acct-label" className="text-xs text-[#F8FAFC]/60">Account label (optional)</Label>
              <Input
                id="acct-label"
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder="e.g. Work account"
                className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="api-key" className="text-xs text-[#F8FAFC]/60">API key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key"
                autoComplete="off"
                className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
              />
            </div>
            {apiKeyDialog?.definition.keyUrl && (
              <a
                href={apiKeyDialog.definition.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#FFD700]/70 hover:text-[#FFD700]"
              >
                <ExternalLink className="size-3" />
                Get an API key from {apiKeyDialog.definition.name}
              </a>
            )}
            <p className="text-xs leading-5 text-[#F8FAFC]/35">
              The key is held in browser memory for this session and is never stored in the database.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApiKeyDialog(null)} className="text-[#F8FAFC]/60">
              Cancel
            </Button>
            <Button
              onClick={() => void handleApiKeyConnect()}
              disabled={!apiKey.trim() || saving}
              className="bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80"
            >
              {saving ? "Connecting…" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MCP server dialog --- */}
      <Dialog open={mcpDialogOpen} onOpenChange={(open) => { if (!open) { setMcpDialogOpen(false); resetMcpForm(); } }}>
        <DialogContent className="border-[#0A1C14] bg-[#0A1C14] text-[#F8FAFC] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="size-5 text-[#FFD700]" />
              {editingServer ? "Edit MCP server" : "Add custom MCP server"}
            </DialogTitle>
            <DialogDescription className="text-[#F8FAFC]/45">
              Configure a Model Context Protocol server to connect external tools and data sources.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mcp-name" className="text-xs text-[#F8FAFC]/60">Server name</Label>
              <Input
                id="mcp-name"
                value={mcpName}
                onChange={(e) => setMcpName(e.target.value)}
                placeholder="e.g. GitHub MCP"
                className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mcp-url" className="text-xs text-[#F8FAFC]/60">
                {mcpTransport === "stdio" ? "Server identifier / package" : "Server URL"}
              </Label>
              <Input
                id="mcp-url"
                value={mcpUrl}
                onChange={(e) => setMcpUrl(e.target.value)}
                placeholder={mcpTransport === "stdio" ? "e.g. @modelcontextprotocol/server-github" : "https://mcp.example.com/sse"}
                className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-[#F8FAFC]/60">Transport</Label>
                <Select value={mcpTransport} onValueChange={(v) => setMcpTransport(v as McpTransport)}>
                  <SelectTrigger className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#0A1C14] bg-[#0A1C14] text-[#F8FAFC]">
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="sse">SSE</SelectItem>
                    <SelectItem value="stdio">Stdio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-[#F8FAFC]/60">Auth type</Label>
                <Select value={mcpAuthType} onValueChange={(v) => setMcpAuthType(v as McpAuthType)}>
                  <SelectTrigger className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#0A1C14] bg-[#0A1C14] text-[#F8FAFC]">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="api_key">API key</SelectItem>
                    <SelectItem value="bearer">Bearer token</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {mcpTransport === "stdio" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcp-command" className="text-xs text-[#F8FAFC]/60">Command (optional)</Label>
                <Input
                  id="mcp-command"
                  value={mcpCommand}
                  onChange={(e) => setMcpCommand(e.target.value)}
                  placeholder="e.g. npx"
                  className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
                />
              </div>
            )}
            {mcpTransport === "stdio" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcp-args" className="text-xs text-[#F8FAFC]/60">Arguments (one per line, optional)</Label>
                <Textarea
                  id="mcp-args"
                  value={mcpArgs}
                  onChange={(e) => setMcpArgs(e.target.value)}
                  placeholder={"--port\n3000"}
                  className="min-h-20 border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="mcp-env" className="text-xs text-[#F8FAFC]/60">
                Environment variable names (comma-separated, names only)
              </Label>
              <Input
                id="mcp-env"
                value={mcpEnvKeys}
                onChange={(e) => setMcpEnvKeys(e.target.value)}
                placeholder="GITHUB_TOKEN, ANTHROPIC_API_KEY"
                className="border-[#F8FAFC]/10 bg-[#040D0A] text-[#F8FAFC] placeholder:text-[#F8FAFC]/25"
              />
              <p className="text-xs text-[#F8FAFC]/30">Only variable names are stored — never their values.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setMcpDialogOpen(false); resetMcpForm(); }} className="text-[#F8FAFC]/60">
              Cancel
            </Button>
            <Button
              onClick={() => void handleMcpSubmit()}
              disabled={!mcpName.trim() || !mcpUrl.trim() || mcpSaving}
              className="bg-[#FFD700] text-[#040D0A] hover:bg-[#FFD700]/80"
            >
              {mcpSaving ? "Saving…" : editingServer ? "Save changes" : "Add server"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && <p className="text-center text-xs text-[#F8FAFC]/30">Loading integration status…</p>}
    </div>
  )
}
