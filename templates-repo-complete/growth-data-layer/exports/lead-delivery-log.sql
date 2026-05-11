-- ============================================================================
-- growth-data-layer/exports/lead-delivery-log.sql
--
-- Journal IMMUTABLE de chaque livraison d'un lead à un acheteur externe.
-- Sert de preuve pour : facturation, contrats d'exclusivité, audit RGPD,
-- résolution de litige.
--
-- Aucune ligne ne peut être modifiée ou supprimée — append-only.
-- ============================================================================

create table if not exists buyers (
  buyer_id              uuid primary key default gen_random_uuid(),
  name                  text not null,
  legal_name            text,
  contact_email         text not null,
  vat_number            text,
  -- Contractuel
  contract_signed_at    timestamptz,
  contract_version      text,
  contract_pdf_url      text,
  -- Limitations d'usage
  allowed_usages        text[] not null default '{}'    -- ex: ['cold_email', 'phone_call', 'crm_import']
                        check (allowed_usages <@ array[
                          'cold_email', 'phone_call', 'crm_import',
                          'remarketing', 'lookalike_audience', 'enrichment_only'
                        ]),
  allowed_categories    text[] not null default '{}',   -- ex: ['saas', 'agence']
  -- Statut
  status                text not null default 'active' check (status in (
                          'active', 'paused', 'terminated', 'breach_of_contract'
                        )),
  -- Audit
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ----------------------------------------------------------------------------

create table if not exists lead_delivery_log (
  id                    uuid primary key default gen_random_uuid(),

  -- Quoi a été livré
  lead_id               uuid not null references master_leads(lead_id),
  contact_id            uuid not null,                  -- snapshot
  source_site_id        text not null,                  -- snapshot

  -- À qui
  buyer_id              uuid not null references buyers(buyer_id),

  -- Quand
  delivered_at          timestamptz not null default now(),

  -- Comment
  delivery_type         text not null check (delivery_type in (
                          'csv_export',
                          'api_push',
                          'crm_sync_hubspot',
                          'crm_sync_salesforce',
                          'crm_sync_pipedrive',
                          'webhook_buyer',
                          'manual_email'
                        )),
  delivery_payload_hash text not null,                  -- sha256 du payload livré (preuve)

  -- Conditions commerciales
  exclusivity_type      text not null check (exclusivity_type in (
                          'exclusive',                    -- vendu à 1 seul acheteur
                          'semi_exclusive',               -- max N acheteurs non concurrents
                          'non_exclusive'                 -- vendu en multi
                        )),
  price_eur             numeric not null check (price_eur >= 0),
  invoice_id            text,                           -- ref Stripe ou facture interne
  allowed_usage         text not null,                  -- ex: 'cold_email'

  -- Compliance snapshot (preuve qu'au moment de la livraison, tout était OK)
  consent_version_at_delivery     text not null,
  sellable_status_at_delivery     text not null,
  data_freshness_at_delivery_days int not null,

  -- Audit
  triggered_by_user_id  uuid,                           -- admin qui a déclenché si manuel
  notes                 text,
  metadata              jsonb not null default '{}'
);

create index if not exists lead_delivery_log_lead_idx on lead_delivery_log(lead_id);
create index if not exists lead_delivery_log_buyer_idx on lead_delivery_log(buyer_id);
create index if not exists lead_delivery_log_delivered_idx on lead_delivery_log(delivered_at desc);

-- ----------------------------------------------------------------------------
-- Append-only triggers
-- ----------------------------------------------------------------------------
create or replace function delivery_log_block_modification()
returns trigger language plpgsql as $$
begin
  raise exception 'lead_delivery_log is append-only — INSERT only';
end;
$$;

drop trigger if exists delivery_log_no_update on lead_delivery_log;
create trigger delivery_log_no_update
  before update on lead_delivery_log
  for each row execute function delivery_log_block_modification();

drop trigger if exists delivery_log_no_delete on lead_delivery_log;
create trigger delivery_log_no_delete
  before delete on lead_delivery_log
  for each row execute function delivery_log_block_modification();

-- ----------------------------------------------------------------------------
-- Fonction : combien de fois ce lead a-t-il été livré ?
-- ----------------------------------------------------------------------------
-- Utile pour gate exclusivité avant livraison.
create or replace function lead_delivery_count(p_lead_id uuid)
returns int language sql stable as $$
  select count(*)::int from lead_delivery_log where lead_id = p_lead_id;
$$;

-- ----------------------------------------------------------------------------
-- Fonction : ce lead est-il déjà sous exclusivité ailleurs ?
-- ----------------------------------------------------------------------------
create or replace function lead_has_active_exclusivity(p_lead_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from lead_delivery_log
    where lead_id = p_lead_id
      and exclusivity_type = 'exclusive'
  );
$$;
