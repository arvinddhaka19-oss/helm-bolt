/*
# Expand integration providers and add MCP servers

1. Modified Tables
- `integration_connections` — the `provider` CHECK constraint is replaced with an expanded list
  covering major AI/LLM platforms and Google:
  google, claude, chatgpt, openai, gemini, perplexity, mistral, groq, anthropic_api,
  cohere, openrouter, ollama
  The old `google_workspace` id is removed in favor of `google`.
  No columns are dropped or renamed; existing data (if any) with the old `google_workspace`
  value is deleted first so the constraint change does not fail.

2. New Tables
- `mcp_servers` — stores custom Model Context Protocol server configurations.
  - `id` (uuid, primary key)
  - `name` (text, not null) — user-facing label
  - `url` (text, not null) — endpoint URL for the MCP server
  - `transport` (text, not null) — 'stdio' | 'sse' | 'http'
  - `auth_type` (text, not null) — 'none' | 'api_key' | 'bearer' | 'oauth'
  - `status` (text, not null, default 'available') — 'available' | 'configured' | 'needs_setup' | 'error'
  - `command` (text) — optional stdio command
  - `args` (jsonb) — optional stdio arguments array
  - `env_keys` (jsonb) — optional list of environment variable names (names only, never values)
  - `last_synced_at` (timestamptz)
  - `created_at` / `updated_at` (timestamptz)

3. Security
- Row-level security is enabled on `mcp_servers`.
- This app has no sign-in screen, so both tables are accessible to anon and authenticated roles.
- Four separate CRUD policies are created for `mcp_servers`.
- API keys and tokens are NEVER stored in the database — only metadata is persisted.

4. Important Notes
- Secrets (API keys, OAuth tokens) remain in the browser session only and are never sent to the database.
- The `env_keys` column stores environment variable NAMES (e.g. ["ANTHROPIC_API_KEY"]) not values.
*/

DELETE FROM public.integration_connections WHERE provider = 'google_workspace';

ALTER TABLE public.integration_connections
  DROP CONSTRAINT IF EXISTS integration_connections_provider_check;

ALTER TABLE public.integration_connections
  ADD CONSTRAINT integration_connections_provider_check
  CHECK (provider IN (
    'google', 'claude', 'chatgpt', 'openai', 'gemini', 'perplexity',
    'mistral', 'groq', 'anthropic_api', 'cohere', 'openrouter', 'ollama'
  ));

CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  transport text NOT NULL CHECK (transport IN ('stdio', 'sse', 'http')),
  auth_type text NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none', 'api_key', 'bearer', 'oauth')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'configured', 'needs_setup', 'error')),
  command text,
  args jsonb,
  env_keys jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_servers TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_mcp_servers" ON public.mcp_servers;
CREATE POLICY "anon_select_mcp_servers"
ON public.mcp_servers FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_insert_mcp_servers" ON public.mcp_servers;
CREATE POLICY "anon_insert_mcp_servers"
ON public.mcp_servers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_mcp_servers" ON public.mcp_servers;
CREATE POLICY "anon_update_mcp_servers"
ON public.mcp_servers FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_mcp_servers" ON public.mcp_servers;
CREATE POLICY "anon_delete_mcp_servers"
ON public.mcp_servers FOR DELETE
TO anon, authenticated
USING (true);
