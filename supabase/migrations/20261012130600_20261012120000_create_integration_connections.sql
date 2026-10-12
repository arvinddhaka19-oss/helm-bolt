/*
# Create integration connection registry

1. New Tables
- `integration_connections` stores which supported providers are configured for this single-tenant dashboard.
- `provider` (text, primary key) identifies the provider and prevents duplicate connection rows.
- `status` (text) stores the user-visible connection state.
- `auth_method` (text) describes whether the provider uses an API key, OAuth, or a local connection.
- `account_label` (text) stores a safe display label only; no credentials are stored.
- `last_synced_at` (timestamptz) records the last successful connection action.
- `created_at` and `updated_at` record lifecycle timestamps.

2. Security
- Row-level security is enabled.
- This app has no sign-in screen, so the single-tenant registry is available to the anon and authenticated app roles.
- Four separate CRUD policies are created for the registry.
- API keys, OAuth tokens, and refresh tokens are intentionally not columns in this table and must never be sent from the browser to the database.

3. Important Notes
- Connection metadata is safe to persist for this single-tenant dashboard.
- Secrets must remain in the provider's secure authorization flow or in the current browser session only.
*/

CREATE TABLE IF NOT EXISTS public.integration_connections (
  provider text PRIMARY KEY CHECK (provider IN ('claude', 'openrouter', 'openai', 'chatgpt', 'ollama', 'google_workspace')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'configured', 'needs_setup')),
  auth_method text NOT NULL CHECK (auth_method IN ('api_key', 'oauth', 'local')),
  account_label text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_integration_connections" ON public.integration_connections;
CREATE POLICY "anon_select_integration_connections"
ON public.integration_connections FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_insert_integration_connections" ON public.integration_connections;
CREATE POLICY "anon_insert_integration_connections"
ON public.integration_connections FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_integration_connections" ON public.integration_connections;
CREATE POLICY "anon_update_integration_connections"
ON public.integration_connections FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_integration_connections" ON public.integration_connections;
CREATE POLICY "anon_delete_integration_connections"
ON public.integration_connections FOR DELETE
TO anon, authenticated
USING (true);
