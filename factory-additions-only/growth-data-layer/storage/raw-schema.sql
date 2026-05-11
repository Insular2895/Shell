-- raw-schema.sql
-- Couche RAW : événements/formulaires/consents bruts. Append-only.
-- Sert à reconstruire staging/master en cas de bug pipeline.

create table if not exists raw_events (
  id              uuid primary key default gen_random_uuid(),
  site_id         text not null,
  visitor_id      uuid,
  contact_id      uuid,
  event_type      text not null,                -- ex: page_view, click, form_view, ...
  event_payload   jsonb not null default '{}',
  user_agent_hash text,
  ip_hash         text,
  occurred_at     timestamptz not null default now()
);

create index if not exists raw_events_site_occurred on raw_events(site_id, occurred_at desc);
create index if not exists raw_events_visitor on raw_events(visitor_id);

-- Append-only
create or replace function raw_events_block_modification() returns trigger language plpgsql as $$
begin raise exception 'raw_events is append-only'; end; $$;
drop trigger if exists raw_events_no_update on raw_events;
create trigger raw_events_no_update before update on raw_events
  for each row execute function raw_events_block_modification();

-- ----------------------------------------------------------------------------

create table if not exists raw_forms (
  id                uuid primary key default gen_random_uuid(),
  site_id           text not null,
  form_id           text not null,                  -- ex: "contact-audit-2026"
  visitor_id        uuid,
  raw_payload       jsonb not null,                 -- champs bruts soumis (avant nettoyage)
  user_agent_hash   text,
  ip_hash           text,
  referer_host      text,
  submitted_at      timestamptz not null default now()
);

create index if not exists raw_forms_site_submitted on raw_forms(site_id, submitted_at desc);

-- ----------------------------------------------------------------------------

-- raw_consent_logs : duplicate de consent_ledger pour la couche raw
-- (au cas où on veut retraiter la chaîne consent → master)
create table if not exists raw_consent_logs (
  id              uuid primary key default gen_random_uuid(),
  site_id         text not null,
  visitor_id      uuid,
  contact_id      uuid,
  consent_payload jsonb not null,
  collected_at    timestamptz not null default now()
);
