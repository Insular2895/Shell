-- ============================================================================
-- growth-data-layer/identity-resolution/identities-schema.sql
--
-- Identity Graph : un même contact peut être vu sous plusieurs identités
-- (email pro + perso, téléphones différents, comptes sociaux). Cette table
-- permet de résoudre l'identité unique d'une personne à travers les sites.
--
-- Outil MVP : Splink (probabilistic record linkage). Phase 2 : Dedupe avec
-- review humaine. Voir splink/run-resolution.py.
-- ============================================================================

-- Identifiants atomiques observés (un email = une identité, un phone = une autre, etc.)
create table if not exists identities (
  id                    uuid primary key default gen_random_uuid(),
  contact_id            uuid not null references master_contacts(contact_id) on delete cascade,
  source_site_id        text not null,
  identity_type         text not null check (identity_type in (
                          'email',
                          'phone',
                          'linkedin',
                          'twitter',
                          'github',
                          'stripe_customer_id',
                          'auth_provider_id',
                          'cookie_uuid'
                        )),
  identity_value_hash   text not null,                  -- sha256 — JAMAIS la valeur brute
  confidence            numeric not null default 1.0
                        check (confidence >= 0 and confidence <= 1),
  observed_at           timestamptz not null default now(),
  last_seen_at          timestamptz not null default now()
);

create index if not exists identities_contact_idx on identities(contact_id);
create index if not exists identities_value_idx on identities(identity_type, identity_value_hash);
create unique index if not exists identities_unique_idx
  on identities(contact_id, identity_type, identity_value_hash);

-- ----------------------------------------------------------------------------

-- Clusters : groupe de contacts considérés comme la même personne
create table if not exists identity_clusters (
  cluster_id            uuid primary key default gen_random_uuid(),
  primary_contact_id    uuid not null references master_contacts(contact_id),
  member_contact_ids    uuid[] not null default '{}',   -- inclut primary
  resolution_method     text not null check (resolution_method in (
                          'deterministic',                -- même email/phone hash
                          'probabilistic_auto',           -- score Splink > 0.90
                          'manual_review',                -- validé par admin
                          'merged_admin'                  -- fusion explicite admin
                        )),
  match_probability     numeric check (match_probability is null or
                                       (match_probability >= 0 and match_probability <= 1)),
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz,
  reviewed_by           uuid                            -- admin user_id
);

create index if not exists identity_clusters_primary_idx on identity_clusters(primary_contact_id);

-- ----------------------------------------------------------------------------

-- Files de fusion à valider (cas score 0.70-0.90 : suggestion mais pas auto)
create table if not exists merge_reviews (
  id                    uuid primary key default gen_random_uuid(),
  contact_a_id          uuid not null references master_contacts(contact_id),
  contact_b_id          uuid not null references master_contacts(contact_id),
  suggested_score       numeric not null check (suggested_score >= 0 and suggested_score <= 1),
  suggested_at          timestamptz not null default now(),
  status                text not null default 'pending' check (status in (
                          'pending',
                          'approved',                     -- merge a été fait
                          'rejected',                     -- pas le même contact
                          'deferred'                      -- pas assez d'info, à revoir
                        )),
  reviewed_by           uuid,
  reviewed_at           timestamptz,
  notes                 text
);

create index if not exists merge_reviews_pending_idx on merge_reviews(status, suggested_score desc)
  where status = 'pending';

-- ----------------------------------------------------------------------------
-- Seuils de fusion (référence — implémentés côté Splink + dbt)
-- ----------------------------------------------------------------------------
-- score > 0.90  → merge automatique (resolution_method='probabilistic_auto')
-- score 0.70..0.90 → INSERT INTO merge_reviews (status='pending')
-- score < 0.70  → ignoré (pas de merge)
--
-- Règles deterministic (toujours appliquées en premier, score=1.0) :
--   - même email_hash → merge
--   - même phone_hash → merge
--   - même stripe_customer_id → merge
-- ----------------------------------------------------------------------------
