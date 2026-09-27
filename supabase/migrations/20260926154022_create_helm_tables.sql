/*
# Create H.E.L.M. database tables (single-tenant, no auth)

## Overview
Creates two tables — `tasks` and `alerts` — to persist the H.E.L.M. app's
KAIROS task list and critical alert ticker. This is a single-tenant app with
no sign-in screen, so all policies allow both `anon` and `authenticated` roles
to read and write (the data is intentionally shared/public).

## 1. New Tables

### `tasks`
Stores KAIROS task/reminders.
- `id` (uuid, primary key, auto-generated)
- `title` (text, not null) — the task description
- `completed` (boolean, default false) — whether the task is done
- `priority` (text, not null, default 'medium') — 'low', 'medium', or 'high'
- `due_label` (text, default 'Today') — human-readable due time label
- `created_at` (timestamp, defaults to now)

### `alerts`
Stores critical alert ticker entries.
- `id` (uuid, primary key, auto-generated)
- `title` (text, not null) — short alert headline
- `description` (text, default '') — longer description
- `severity` (text, not null, default 'info') — 'info', 'warning', or 'critical'
- `time` (text, not null) — human-readable time label (e.g. "20:00")
- `created_at` (timestamp, defaults to now)

## 2. Security
- Row Level Security enabled on both tables.
- Four CRUD policies per table (SELECT, INSERT, UPDATE, DELETE), all scoped
  to `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` since
  this is a single-tenant app with no sign-in and the data is intentionally public.

## 3. Indexes
- `tasks_created_at_idx` on `tasks(created_at)` for ordering.
- `alerts_created_at_idx` on `alerts(created_at)` for ordering.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium',
  due_label text NOT NULL DEFAULT 'Today',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks (created_at);
CREATE INDEX IF NOT EXISTS alerts_created_at_idx ON alerts (created_at);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Tasks policies
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- Alerts policies
DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (true);
