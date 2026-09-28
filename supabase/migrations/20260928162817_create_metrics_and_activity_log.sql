/*
# Create metrics + activity_log tables (single-tenant, no auth)

## Overview
Adds two new tables to support the H.E.L.M. voice-driven experience:
- `metrics` stores time-series history of ATLAS (body) and METIS (mind) metrics.
  Each row is a single metric reading, so we keep a full history of every
  update over time (enabling trends/charts later) rather than overwriting.
- `activity_log` stores every system activity entry generated when the user
  speaks an update, giving a persistent timeline that survives page reloads.

## 1. New Tables

### `metrics`
- `id` (uuid, primary key, auto-generated)
- `module` (text, not null) — 'ATLAS' or 'METIS'
- `label` (text, not null) — e.g. 'Sleep', 'Focus', 'Hydration'
- `value` (text, not null) — display value, e.g. '7.0h', '65%', 'Steady'
- `status` (text, not null, default 'good') — 'good', 'warning', 'critical'
- `percent` (int, nullable) — optional 0-100 for progress bar display
- `created_at` (timestamptz, defaults to now) — when this reading was logged

### `activity_log`
- `id` (uuid, primary key, auto-generated)
- `source` (text, not null) — 'ATLAS', 'METIS', 'KAIROS', 'HELM', or 'VOICE'
- `text` (text, not null) — the activity message shown in the log
- `created_at` (timestamptz, defaults to now) — when the entry was logged

## 2. Security
- Row Level Security enabled on both tables.
- Four CRUD policies per table (SELECT, INSERT, UPDATE, DELETE), all scoped
  to `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` since
  this is a single-tenant app with no sign-in and the data is intentionally public.

## 3. Indexes
- `metrics_label_created_at_idx` on `metrics(label, created_at DESC)` so we can
  efficiently fetch the latest reading per metric label.
- `activity_log_created_at_idx` on `activity_log(created_at DESC)` for ordering
  the timeline newest-first.
*/

CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  status text NOT NULL DEFAULT 'good',
  percent int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS metrics_label_created_at_idx
  ON metrics (label, created_at DESC);

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx
  ON activity_log (created_at DESC);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Metrics policies
DROP POLICY IF EXISTS "anon_select_metrics" ON metrics;
CREATE POLICY "anon_select_metrics" ON metrics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_metrics" ON metrics;
CREATE POLICY "anon_insert_metrics" ON metrics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_metrics" ON metrics;
CREATE POLICY "anon_update_metrics" ON metrics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_metrics" ON metrics;
CREATE POLICY "anon_delete_metrics" ON metrics FOR DELETE
  TO anon, authenticated USING (true);

-- Activity log policies
DROP POLICY IF EXISTS "anon_select_activity_log" ON activity_log;
CREATE POLICY "anon_select_activity_log" ON activity_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activity_log" ON activity_log;
CREATE POLICY "anon_insert_activity_log" ON activity_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activity_log" ON activity_log;
CREATE POLICY "anon_update_activity_log" ON activity_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activity_log" ON activity_log;
CREATE POLICY "anon_delete_activity_log" ON activity_log FOR DELETE
  TO anon, authenticated USING (true);

-- Seed initial ATLAS metrics
INSERT INTO metrics (module, label, value, status, percent)
VALUES
  ('ATLAS', 'Sleep', '6.5h', 'warning', 65),
  ('ATLAS', 'Strain', 'High', 'critical', 85),
  ('ATLAS', 'Readiness', '72%', 'good', 72),
  ('ATLAS', 'Hydration', '60%', 'warning', 60)
ON CONFLICT DO NOTHING;

-- Seed initial METIS metrics
INSERT INTO metrics (module, label, value, status, percent)
VALUES
  ('METIS', 'Focus', 'Drifting', 'critical', null),
  ('METIS', 'Cognitive Load', 'Medium', 'warning', null),
  ('METIS', 'Mood', 'Steady', 'good', null),
  ('METIS', 'Sensory Load', 'Moderate', 'warning', null)
ON CONFLICT DO NOTHING;

-- Seed initial activity log entries
INSERT INTO activity_log (source, text)
VALUES
  ('HELM', 'System initialized — all modules online'),
  ('ATLAS', 'Baseline biometrics recorded'),
  ('METIS', 'Cognitive baseline established'),
  ('KAIROS', 'Task queue loaded')
ON CONFLICT DO NOTHING;
