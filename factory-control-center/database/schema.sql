-- ============================================================================
-- factory-control-center/database/schema.sql
--
-- Tables du cockpit multi-sites. Stocke ce que le dashboard affiche :
-- registre des sites, P&L, incidents, déploiements, statut, file de décisions
-- en attente de validation humaine.
--
-- Cette base peut être :
--   - une schema séparée dans la même Supabase qu'un produit (cockpit_*)
--   - une Supabase dédiée (recommandé si > 3 sites)
--
-- Lecture : factory-control-center/api/*.route.ts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Registre des sites
-- ----------------------------------------------------------------------------
create table if not exists sites (
  site_id           text primary key,                  -- ex: 'document-extractor'
  name              text not null,
  repo_url          text not null,
  production_url    text,
  staging_url       text,

  -- Stack
  frontend          text,                              -- ex: 'nextjs'
  backend           text,                              -- ex: 'supabase'
  jobs              text,                              -- ex: 'triggerdev', 'fly-worker'
  hosting           text,                              -- ex: 'vercel', 'coolify-hetzner'

  -- Statut & ownership
  legal_status      text not null default 'compliant'
                    check (legal_status in ('compliant', 'review_needed', 'paused')),
  owner_user_id     uuid,
  owner_email       text,

  -- Budget & limites
  monthly_budget_eur          numeric not null default 100,
  monthly_alert_threshold_pct int not null default 80,

  -- Audit
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Statut courant de chaque site (singleton par site)
-- ----------------------------------------------------------------------------
create table if not exists site_status (
  site_id           text primary key references sites(site_id) on delete cascade,
  mode              text not null default 'normal'
                    check (mode in ('normal', 'degraded', 'maintenance', 'fallback', 'paused')),
  message           text,
  disabled_features text[] not null default '{}',
  fallback_blocks   text[] not null default '{}',
  reason            text,
  changed_at        timestamptz not null default now(),
  changed_by        text                                -- 'autopilot' | user_id | 'manual_admin'
);

-- ----------------------------------------------------------------------------
-- 3. Revenus
-- ----------------------------------------------------------------------------
create table if not exists revenues (
  id                uuid primary key default gen_random_uuid(),
  site_id           text not null references sites(site_id) on delete cascade,
  -- Source
  source            text not null check (source in (
                      'stripe_subscription', 'stripe_oneshot', 'affiliate',
                      'lead_sale', 'api_data', 'consulting', 'ads', 'other'
                    )),
  amount_eur        numeric not null check (amount_eur >= 0),
  currency          text not null default 'EUR',
  -- Référence
  external_ref      text,                              -- ex: stripe charge id, lead_delivery_log.id
  customer_email_hash text,
  -- Période
  occurred_at       timestamptz not null,
  period_start      timestamptz,
  period_end        timestamptz,
  -- Audit
  created_at        timestamptz not null default now(),
  metadata          jsonb not null default '{}'
);

create index if not exists revenues_site_idx on revenues(site_id);
create index if not exists revenues_occurred_idx on revenues(occurred_at desc);

-- ----------------------------------------------------------------------------
-- 4. Coûts
-- ----------------------------------------------------------------------------
create table if not exists expenses (
  id                uuid primary key default gen_random_uuid(),
  -- Attribution
  site_id           text references sites(site_id) on delete set null,
  is_shared         boolean not null default false,    -- coût partagé entre sites
  -- Catégorie
  category          text not null check (category in (
                      'hosting', 'database', 'storage', 'email', 'domain',
                      'ai_usage', 'monitoring', 'stripe_fees', 'human_time',
                      'tooling', 'security_audit', 'other'
                    )),
  vendor            text,                              -- ex: 'Vercel', 'Supabase', 'OpenAI'
  amount_eur        numeric not null check (amount_eur >= 0),
  currency          text not null default 'EUR',
  -- Période
  occurred_at       timestamptz not null,
  period_start      timestamptz,
  period_end        timestamptz,
  -- Audit
  external_ref      text,
  created_at        timestamptz not null default now(),
  metadata          jsonb not null default '{}'
);

create index if not exists expenses_site_idx on expenses(site_id);
create index if not exists expenses_occurred_idx on expenses(occurred_at desc);
create index if not exists expenses_category_idx on expenses(category);

-- ----------------------------------------------------------------------------
-- 5. Évènements d'usage (pour P&L par job)
-- ----------------------------------------------------------------------------
create table if not exists usage_events (
  id                uuid primary key default gen_random_uuid(),
  site_id           text not null references sites(site_id),
  event_type        text not null,                     -- ex: 'job_completed', 'ai_call', 'storage_write'
  user_id_hash      text,
  -- Coût estimé pour cet event (calculé par le worker)
  cost_estimate_eur numeric not null default 0,
  -- Contexte
  metadata          jsonb not null default '{}',
  occurred_at       timestamptz not null default now()
);

create index if not exists usage_events_site_occurred on usage_events(site_id, occurred_at desc);

-- ----------------------------------------------------------------------------
-- 6. Incidents
-- ----------------------------------------------------------------------------
create table if not exists incidents (
  id                uuid primary key default gen_random_uuid(),
  site_id           text references sites(site_id) on delete set null,
  severity          text not null check (severity in ('P0', 'P1', 'P2', 'P3', 'info')),
  status            text not null default 'open'
                    check (status in ('open', 'investigating', 'mitigated', 'resolved', 'closed')),
  title             text not null,
  description       text,
  detected_by       text not null,                     -- 'autopilot' | user_id | 'sentry' | etc.
  detected_at       timestamptz not null default now(),
  resolved_at       timestamptz,
  postmortem_url    text,                              -- vers reports/incidents/<id>.md
  metadata          jsonb not null default '{}'
);

create index if not exists incidents_open_idx on incidents(site_id, severity)
  where status not in ('resolved', 'closed');

-- ----------------------------------------------------------------------------
-- 7. Déploiements
-- ----------------------------------------------------------------------------
create table if not exists deployments (
  id                uuid primary key default gen_random_uuid(),
  site_id           text not null references sites(site_id),
  environment       text not null check (environment in ('staging', 'production')),
  commit_sha        text,
  pr_number         int,
  deployed_at       timestamptz not null default now(),
  deployed_by       text,                              -- 'github-actions' | user_id
  status            text not null default 'pending'
                    check (status in ('pending', 'in_progress', 'success', 'failed', 'rolled_back')),
  rollback_to       uuid references deployments(id),
  metadata          jsonb not null default '{}'
);

-- ----------------------------------------------------------------------------
-- 8. File de décisions à valider (humain)
-- ----------------------------------------------------------------------------
create table if not exists decision_queue (
  id                uuid primary key default gen_random_uuid(),
  site_id           text references sites(site_id),
  decision_type     text not null,                     -- ex: 'export_data', 'deploy_to_prod', 'upgrade_paid_plan'
  proposed_by       text not null,                     -- 'autopilot' | agent_id | user_id
  proposed_at       timestamptz not null default now(),
  rationale         text not null,
  payload           jsonb not null default '{}',
  -- Résolution
  status            text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'expired', 'auto_resolved')),
  resolved_at       timestamptz,
  resolved_by       uuid,
  resolution_notes  text
);

create index if not exists decision_queue_pending_idx on decision_queue(proposed_at desc)
  where status = 'pending';

-- ----------------------------------------------------------------------------
-- 9. Exports data (référence vers growth-data-layer.lead_delivery_log)
-- ----------------------------------------------------------------------------
-- Vue qui aggrège les exports pour le cockpit (sans dupliquer la donnée).
-- Suppose que growth-data-layer.lead_delivery_log existe.
-- create or replace view data_exports_summary as ...
-- La vue sera activée quand growth-data-layer est branché au cockpit.

-- ----------------------------------------------------------------------------
-- 10. Vue P&L par site (mart calculé)
-- ----------------------------------------------------------------------------
create or replace view mart_pnl_by_site as
select
  s.site_id,
  s.name,
  -- Mois courant
  date_trunc('month', now())                       as month,
  coalesce(sum(r.amount_eur) filter (where r.occurred_at >= date_trunc('month', now())), 0) as revenue_eur,
  coalesce(sum(e.amount_eur) filter (where e.occurred_at >= date_trunc('month', now()) and not e.is_shared), 0) as direct_cost_eur,
  -- Note: les coûts partagés s'allouent dans finance-ledger/policies/shared-cost-policy.md
  s.monthly_budget_eur                             as budget_eur
from sites s
left join revenues r on r.site_id = s.site_id
left join expenses e on e.site_id = s.site_id
group by s.site_id, s.name, s.monthly_budget_eur;
