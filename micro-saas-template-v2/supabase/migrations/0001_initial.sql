-- ============================================================================
-- 0001_initial.sql
--
-- Schéma DB universel pour le micro-saas-template.
-- Référence RLS officielle Supabase : https://supabase.com/docs/guides/database/postgres/row-level-security
--
-- Bonnes pratiques appliquées :
--   - RLS activé sur TOUTES les tables exposées (sinon = data leak via anon key)
--   - Policies utilisent `(SELECT auth.uid())` au lieu de `auth.uid()` direct
--     → Postgres met en cache le résultat pour la requête (10-100x plus rapide)
--   - Clause `TO authenticated` partout pour court-circuiter l'évaluation pour anon
--   - Index sur les colonnes citées dans les policies (user_id) — sinon scans full
-- ============================================================================

-- ============================================================================
-- Table : jobs
-- ============================================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  status text not null check (status in ('pending', 'running', 'success', 'error', 'cancelled')),
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);

alter table public.jobs enable row level security;

drop policy if exists "users select own jobs" on public.jobs;
create policy "users select own jobs"
  on public.jobs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users insert own jobs" on public.jobs;
create policy "users insert own jobs"
  on public.jobs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- No authenticated UPDATE policy: job state/result is system-owned and updated
-- only by service-role API handlers/workers. Users read their own jobs but
-- cannot forge status/result through the Supabase client.

-- ============================================================================
-- Table : subscriptions
-- ============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_id text not null default 'free',
  status text not null default 'inactive'
    check (status in ('inactive', 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'cancelled', 'unpaid', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "users select own subscription" on public.subscriptions;
create policy "users select own subscription"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Pas de policy INSERT/UPDATE pour `authenticated` → seul le service-role
-- (webhook Stripe) peut écrire ici. C'est volontaire et critique : un user
-- ne doit JAMAIS pouvoir s'auto-upgrader son plan.

-- ============================================================================
-- Table : stripe_events (idempotence des webhooks)
-- ============================================================================
create table if not exists public.stripe_events (
  id text primary key,           -- event.id de Stripe (evt_xxx)
  type text not null,
  received_at timestamptz not null default now()
);

create index if not exists stripe_events_received_idx on public.stripe_events(received_at desc);

alter table public.stripe_events enable row level security;
-- Aucune policy → seul le service-role accède à cette table (via le webhook).

-- ============================================================================
-- Table : usage_events (audit trail)
-- ============================================================================
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  product_id text,
  job_id uuid references public.jobs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_idx on public.usage_events(user_id, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "users select own usage" on public.usage_events;
create policy "users select own usage"
  on public.usage_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- Trigger : updated_at automatique
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_jobs on public.jobs;
create trigger set_updated_at_jobs
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_subs on public.subscriptions;
create trigger set_updated_at_subs
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();
