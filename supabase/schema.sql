-- ============================================================
-- MovieBox International — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- BEFORE wiring the app to your project.
-- ============================================================

-- Raw analytics events (page views, blocks, downloads, …)
create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  type        text        not null,
  session_id  text,
  platform    text        default 'other',
  device      text        default 'desktop',
  region      text        default '',
  path        text        default '/',
  referrer    text        default '',
  meta        jsonb       default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists analytics_events_type_idx
  on public.analytics_events (type);
create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);

-- Single-row runtime settings (blocklist, auto-redirect, popup copy,
-- real installer URL). Edited live from the Admin dashboard.
create table if not exists public.app_settings (
  id                     int primary key default 1 check (id = 1),
  blocked_platforms      jsonb       not null default '["mobile","mac","chromeos","linux","other"]'::jsonb,
  auto_redirect_enabled  boolean     not null default true,
  auto_redirect_seconds  int         not null default 20,
  popup_message          text        not null default 'Thank you & enjoy the great movies! 🍿',
  download_url           text        not null default '',
  updated_at             timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Security: the app talks to Supabase ONLY from the server with
-- the service role key (which bypasses RLS). Enable RLS with NO
-- public policies so anon/authenticated visitors can never read
-- analytics or tamper with settings from the browser.
-- ------------------------------------------------------------
alter table public.analytics_events enable row level security;
alter table public.app_settings     enable row level security;
