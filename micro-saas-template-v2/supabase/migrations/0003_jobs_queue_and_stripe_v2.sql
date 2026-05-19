-- ============================================================================
-- 0003_jobs_queue_and_stripe_v2.sql
--
-- Corrige les blockers de la v1 identifiés en review :
--
--   1. Le pattern `void async () => runEngine()` côté API n'est PAS fiable sur
--      Vercel : la fonction se termine dès qu'on retourne la réponse HTTP, le
--      job peut être tué. → on ajoute un vrai pattern queue + worker externe
--      avec attempts/lease/retry.
--
--   2. La v1 stockait `subscriptions.plan_id = stripe_price_id` (price_xxx),
--      alors que `lib/quota.ts` cherche par `productConfig.pricing.plans[].id`
--      ('starter', 'pro'). Conséquence : tout abonné payant tombe en plan
--      'free' silencieusement. → on sépare `plan_id` (logique produit) et
--      `stripe_price_id` (référence Stripe).
--
--   3. La v1 stockait `stripe_events.id` AVANT de traiter. Si le handler
--      crashait, Stripe retry mais on disait "déjà traité" → données perdues.
--      → on ajoute `status` (processing/processed/failed) et on update à la
--      fin du handler.
--
-- Référence : webhook patterns systemdesignschool.io, Stripe official docs
--   - "verify → enqueue → ACK" pour répondre <10s
--   - At-least-once delivery + idempotency = exactly-once approximation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Queue : ajout des colonnes pour worker externe
-- ----------------------------------------------------------------------------

-- Statuses étendus :
--   pending    → créé, attend un worker
--   running    → un worker l'a leasé, en cours
--   success    → terminé OK
--   error      → terminé en erreur (peut-être retry)
--   cancelled  → annulé par l'user
--   timed_out  → lease dépassé sans completion
alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check
  check (status in ('pending', 'running', 'success', 'error', 'cancelled', 'timed_out'));

-- Pour worker pull-based : qui a leasé, jusqu'à quand, combien d'essais
alter table public.jobs add column if not exists attempts int not null default 0;
alter table public.jobs add column if not exists max_attempts int not null default 3;
alter table public.jobs add column if not exists locked_at timestamptz;
alter table public.jobs add column if not exists lease_until timestamptz;
alter table public.jobs add column if not exists worker_id text;
alter table public.jobs add column if not exists started_at timestamptz;
alter table public.jobs add column if not exists finished_at timestamptz;
alter table public.jobs add column if not exists failed_reason text;

-- Index pour le worker : "donne-moi les jobs pending OU timed-out lease"
create index if not exists jobs_pending_idx
  on public.jobs(status, lease_until)
  where status in ('pending', 'running');

-- ----------------------------------------------------------------------------
-- 2. job_attempts : journal de chaque tentative pour debug/audit
-- ----------------------------------------------------------------------------
create table if not exists public.job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  attempt_number int not null,
  worker_id text,
  status text not null check (status in ('running', 'success', 'error', 'timed_out')),
  error text,
  duration_ms int,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists job_attempts_job_idx on public.job_attempts(job_id);

alter table public.job_attempts enable row level security;

-- L'utilisateur ne voit que les attempts de SES jobs (via jointure)
drop policy if exists "users select own job attempts" on public.job_attempts;
create policy "users select own job attempts"
  on public.job_attempts for select
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_attempts.job_id
        and j.user_id = (select auth.uid())
    )
  );

-- Pas de policy INSERT/UPDATE/DELETE pour authenticated → seul service_role écrit.

-- ----------------------------------------------------------------------------
-- 3. Atomic lease function : pour worker concurrent-safe
-- ----------------------------------------------------------------------------
-- Un worker appelle claim_next_job(worker_id, lease_seconds) et reçoit 0 ou 1
-- job. Le SKIP LOCKED garantit que 2 workers concurrents ne prennent pas le
-- même job. Pattern PostgreSQL queue éprouvé.
create or replace function public.claim_next_job(
  p_worker_id text,
  p_lease_seconds int default 900,
  p_product_id text default null
)
returns public.jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.jobs;
begin
  update public.jobs
  set
    status = 'running',
    locked_at = now(),
    lease_until = now() + (p_lease_seconds || ' seconds')::interval,
    worker_id = p_worker_id,
    attempts = attempts + 1,
    started_at = coalesce(started_at, now())
  where id = (
    select j.id from public.jobs j
    where (
      -- Jobs jamais leasés
      j.status = 'pending'
      -- OU jobs leasés mais lease expiré (worker crashé) ET pas trop d'essais
      or (j.status = 'running' and j.lease_until < now() and j.attempts < j.max_attempts)
    )
    and (p_product_id is null or j.product_id = p_product_id)
    order by j.created_at asc
    limit 1
    for update skip locked
  )
  returning * into v_job;

  return v_job;
end;
$$;

revoke all on function public.claim_next_job(text, int, text) from public, anon, authenticated;
-- Seul service_role peut appeler cette fonction.

-- ----------------------------------------------------------------------------
-- 4. Cron-friendly : marquer les jobs timed-out
-- ----------------------------------------------------------------------------
create or replace function public.mark_timed_out_jobs()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  with marked as (
    update public.jobs
    set
      status = case
        when attempts >= max_attempts then 'timed_out'
        else 'pending' -- retry
      end,
      lease_until = null,
      locked_at = null,
      worker_id = null,
      failed_reason = 'lease expired'
    where status = 'running' and lease_until < now()
    returning 1
  )
  select count(*) into v_count from marked;
  return v_count;
end;
$$;

revoke all on function public.mark_timed_out_jobs() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Subscriptions : séparer plan_id (logique) et stripe_price_id (Stripe)
-- ----------------------------------------------------------------------------
-- BUG v1 : plan_id stockait price_xxx → checkQuota cherchait 'starter'/'pro'
-- → tout abonné payant retombait en 'free'. Fix : ajouter stripe_price_id.
alter table public.subscriptions
  add column if not exists stripe_price_id text;

create index if not exists subscriptions_stripe_price_idx
  on public.subscriptions(stripe_price_id);

-- ----------------------------------------------------------------------------
-- 6. stripe_events : statut explicite au lieu de "présent = traité"
-- ----------------------------------------------------------------------------
-- BUG v1 : on insérait event.id AVANT le traitement. Si le handler crashait,
-- Stripe retry mais on disait "déjà traité" → données perdues.
alter table public.stripe_events
  add column if not exists status text not null default 'processed'
  check (status in ('processing', 'processed', 'failed'));

alter table public.stripe_events
  add column if not exists error text;

alter table public.stripe_events
  add column if not exists processed_at timestamptz;

create index if not exists stripe_events_status_idx on public.stripe_events(status);

-- ----------------------------------------------------------------------------
-- 7. site_config : permet l'auto-degradation Shell
-- ----------------------------------------------------------------------------
-- Une ligne unique (singleton). Permet au cron `auto-degrade` de basculer le
-- site en mode "mock" si pas d'utilisateur actif depuis N jours, pour réduire
-- les coûts (engine éteint, jobs renvoient mock). Réversible automatiquement
-- dès le premier vrai user.
create table if not exists public.site_config (
  id boolean primary key default true check (id),  -- empêche >1 ligne
  engine_mode text not null default 'live'
    check (engine_mode in ('live', 'mock', 'maintenance')),
  reason text,
  updated_at timestamptz not null default now()
);

insert into public.site_config (id) values (true) on conflict do nothing;

alter table public.site_config enable row level security;

-- Lisible par tout le monde (anon inclus, pour afficher un bandeau "maintenance")
drop policy if exists "anyone reads site config" on public.site_config;
create policy "anyone reads site config"
  on public.site_config for select
  to anon, authenticated
  using (true);

-- Pas de policy INSERT/UPDATE pour authenticated → seul service_role modifie.

-- ----------------------------------------------------------------------------
-- 8. Quota counter atomique (anti race condition)
-- ----------------------------------------------------------------------------
-- v1 : checkQuota lisait le count puis insertait → race condition possible si
-- 2 jobs créés simultanément. Fix : function atomique qui incrémente et
-- vérifie le quota dans la même transaction.
create or replace function public.try_consume_quota(
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_limit int
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  -- Verrou sur la ligne user pour éviter la race
  perform 1 from auth.users where id = p_user_id for update;

  select count(*) into v_count from public.jobs
  where user_id = p_user_id
    and created_at >= p_period_start
    and created_at < p_period_end
    and status not in ('cancelled', 'error');

  if v_count >= p_limit then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.try_consume_quota(uuid, timestamptz, timestamptz, int) from public, anon, authenticated;

-- Production path: check quota and insert the job while holding the same lock.
-- Called by /api/jobs/create through the service-role client.
create or replace function public.create_job_with_quota(
  p_user_id uuid,
  p_product_id text,
  p_input jsonb,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_limit int
)
returns public.jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
  v_job public.jobs;
begin
  perform 1 from auth.users where id = p_user_id for update;

  select count(*) into v_count from public.jobs
  where user_id = p_user_id
    and created_at >= p_period_start
    and created_at < p_period_end
    and status in ('pending', 'running', 'success');

  if v_count >= p_limit then
    return null;
  end if;

  insert into public.jobs (user_id, product_id, status, input)
  values (p_user_id, p_product_id, 'pending', p_input)
  returning * into v_job;

  return v_job;
end;
$$;

revoke all on function public.create_job_with_quota(uuid, text, jsonb, timestamptz, timestamptz, int) from public, anon, authenticated;
