-- ============================================================================
-- growth-data-layer/storage/master-schema.sql
--
-- Couche MASTER : vue unifiée des contacts, entreprises et leads après
-- nettoyage staging. Cette couche n'est JAMAIS exposée directement aux
-- acheteurs — seuls les marts dérivés (mart_sellable_leads) le sont.
--
-- Champ critique : sellable_status. Calculé par dbt + règles de
-- compliance/exports. Aucun export n'est possible si sellable_status !=
-- 'eligible'. Voir growth-data-layer/exports/export-policy.md.
-- ============================================================================

-- Contacts (personnes physiques)
create table if not exists master_contacts (
  contact_id            uuid primary key default gen_random_uuid(),
  -- IDs externes
  source_site_ids       text[] not null default '{}',  -- contact peut venir de N sites
  source_urls           text[] not null default '{}',
  external_ids          jsonb not null default '{}',   -- ex: {"hubspot": "...", "stripe": "cus_..."}

  -- Identité (HASH ONLY — original dans table chiffrée séparée si besoin RGPD)
  email_hash            text,                           -- sha256
  phone_hash            text,                           -- sha256 normalized
  first_name            text,                           -- pour fusion fuzzy
  last_name             text,
  display_name          text,                           -- single field, cf awesome-falsehood
  job_title             text,
  linkedin_url          text,

  -- Liens
  primary_company_id    uuid,                           -- → master_companies
  identity_cluster_id   uuid,                           -- → identity_clusters

  -- Vérification
  verification_level    text not null default 'unverified'
                        check (verification_level in (
                          'unverified',
                          'email_verified',
                          'phone_verified',
                          'form_submitted',
                          'meeting_booked',
                          'paying_customer'
                        )),
  email_verified_at     timestamptz,
  phone_verified_at     timestamptz,

  -- Compliance
  opt_out               boolean not null default false,
  opt_out_at            timestamptz,
  opt_out_reason        text,

  -- Timestamps
  first_seen_at         timestamptz not null default now(),
  last_activity_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists master_contacts_email_hash_idx on master_contacts(email_hash);
create index if not exists master_contacts_phone_hash_idx on master_contacts(phone_hash);
create index if not exists master_contacts_company_idx on master_contacts(primary_company_id);
create index if not exists master_contacts_cluster_idx on master_contacts(identity_cluster_id);

-- ----------------------------------------------------------------------------

-- Companies (personnes morales)
create table if not exists master_companies (
  company_id            uuid primary key default gen_random_uuid(),
  -- Identifiants officiels
  siren                 text,                           -- France
  siret                 text,
  vat_number            text,                           -- TVA intracom
  duns                  text,                           -- D&B
  -- Identité
  name                  text not null,
  legal_name            text,
  website               text,
  domain                text,                           -- ex: "example.com" pour matching email
  industry              text,
  sector                text,
  size_range            text                            -- "1-10", "11-50", "51-200", "201-500", "501+"
                        check (size_range in (
                          '1-10', '11-50', '51-200',
                          '201-500', '501-1000', '1001+'
                        )),
  country               text,                           -- ISO 3166-1 alpha-2
  city                  text,
  -- Enrichissement
  estimated_revenue     numeric,
  ad_spend_estimate     text,                           -- "low", "medium", "high"
  tech_stack            text[] not null default '{}',
  -- Timestamps
  first_seen_at         timestamptz not null default now(),
  last_enriched_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists master_companies_siren_idx on master_companies(siren);
create index if not exists master_companies_domain_idx on master_companies(domain);

-- ----------------------------------------------------------------------------

-- Leads (croisement contact + besoin + intention commerciale)
create table if not exists master_leads (
  lead_id                   uuid primary key default gen_random_uuid(),

  -- Liens
  contact_id                uuid not null references master_contacts(contact_id),
  company_id                uuid references master_companies(company_id),

  -- Source
  source_site_id            text not null,                 -- ex: "document-extractor"
  source_url                text,
  source_form_id            text,
  source_campaign_utm       jsonb,                         -- {source, medium, campaign, term, content}
  collected_at              timestamptz not null default now(),
  last_activity_at          timestamptz,

  -- Besoin exprimé
  need                      text,                          -- description libre
  need_category             text,                          -- ex: "audit-seo", "extraction-doc"
  budget_range              text                            -- "<1k", "1-5k", "5-20k", "20k+"
                            check (budget_range is null or budget_range in (
                              '<1k', '1-5k', '5-20k', '20k+'
                            )),
  timing                    text                            -- "immediate", "1-3m", "3-6m", "6m+"
                            check (timing is null or timing in (
                              'immediate', '1-3m', '3-6m', '6m+'
                            )),

  -- Scoring (alimenté par lead-scoring/)
  intent_score              numeric check (intent_score is null or (intent_score >= 0 and intent_score <= 100)),
  lead_quality_score        numeric check (lead_quality_score is null or (lead_quality_score >= 0 and lead_quality_score <= 100)),
  buyer_fit_score           numeric check (buyer_fit_score is null or (buyer_fit_score >= 0 and buyer_fit_score <= 100)),

  -- Consentements (snapshot au moment de la collecte — preuve dans consent_ledger)
  consent_prospection       boolean not null default false,
  consent_partners          boolean not null default false,
  consent_ads               boolean not null default false,
  consent_version           text not null,                 -- ex: "v2026-01-CGU-FR"
  consent_collected_at      timestamptz not null,

  -- Limitations d'usage
  allowed_channels          text[] not null default '{}',  -- ex: ['email', 'phone']
  allowed_partner_categories text[] not null default '{}', -- ex: ['saas', 'agence']

  -- ⭐ CHAMP CRITIQUE — le seul gate d'export
  sellable_status           text not null default 'unverified'
                            check (sellable_status in (
                              'eligible',                  -- OK pour vente externe
                              'internal_only',             -- usage interne uniquement
                              'missing_partner_consent',   -- consent_partners=false
                              'expired',                   -- retention dépassé
                              'opt_out',                   -- contact a opt-out
                              'unverified',                -- pas encore vérifié
                              'blocked_by_policy'          -- bloqué manuellement
                            )),
  sellable_reason           text,                          -- pourquoi pas eligible
  sellable_computed_at      timestamptz,
  retention_expires_at      timestamptz not null,          -- date dur après laquelle export interdit

  -- Fraîcheur
  data_freshness_days       int generated always as (
                              extract(day from (now() - last_activity_at))::int
                            ) stored,

  -- Dédoublonnage
  duplicate_cluster_id      uuid,                          -- → identity_clusters
  is_primary_in_cluster     boolean not null default true,

  -- Métadonnées
  notes                     text,
  tags                      text[] not null default '{}',

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists master_leads_contact_idx on master_leads(contact_id);
create index if not exists master_leads_company_idx on master_leads(company_id);
create index if not exists master_leads_site_idx on master_leads(source_site_id);
create index if not exists master_leads_sellable_idx on master_leads(sellable_status) where sellable_status = 'eligible';
create index if not exists master_leads_collected_idx on master_leads(collected_at desc);
create index if not exists master_leads_retention_idx on master_leads(retention_expires_at);

-- ----------------------------------------------------------------------------
-- Vue : leads vendables (la SEULE vue à laquelle l'export gate fait référence)
-- ----------------------------------------------------------------------------
-- Toute autre logique d'export DOIT passer par cette vue.
-- Ne jamais SELECT * FROM master_leads dans un export.
create or replace view mart_sellable_leads as
select
  l.lead_id,
  l.contact_id,
  l.company_id,
  l.source_site_id,
  l.source_url,
  l.collected_at,
  l.last_activity_at,
  l.need,
  l.need_category,
  l.budget_range,
  l.timing,
  l.intent_score,
  l.lead_quality_score,
  l.buyer_fit_score,
  l.allowed_channels,
  l.allowed_partner_categories,
  l.data_freshness_days,
  l.retention_expires_at,
  c.email_hash,
  c.phone_hash,
  c.verification_level,
  comp.name           as company_name,
  comp.industry,
  comp.sector,
  comp.size_range,
  comp.country
from master_leads l
join master_contacts c on c.contact_id = l.contact_id
left join master_companies comp on comp.company_id = l.company_id
where l.sellable_status = 'eligible'
  and l.opt_out is not true
  and c.opt_out is not true
  and l.consent_partners = true
  and l.data_freshness_days <= 90
  and l.retention_expires_at > now()
  and c.verification_level in ('email_verified', 'phone_verified', 'form_submitted', 'meeting_booked', 'paying_customer');

comment on view mart_sellable_leads is
  'Single source of truth pour les exports vers acheteurs. NE JAMAIS contourner ce gate.';
