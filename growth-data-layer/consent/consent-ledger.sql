-- ============================================================================
-- growth-data-layer/consent/consent-ledger.sql
--
-- Registre IMMUTABLE des consentements collectés. Une ligne par évènement
-- de consentement (collecte, retrait, modification). Append-only — on ne
-- met jamais à jour, on ajoute une nouvelle ligne avec status='revoked'.
--
-- Cette table sert de preuve légale en cas de contrôle CNIL ou de demande
-- d'un utilisateur (droit d'accès, opposition, effacement).
--
-- Référence : CNIL — règles de prospection électronique B2C/B2B,
-- preuves de consentement requises selon la base légale invoquée.
-- ============================================================================

create table if not exists consent_ledger (
  id                      uuid primary key default gen_random_uuid(),

  -- Sujet du consentement
  contact_id              uuid,                          -- null si visiteur anonyme
  visitor_id              uuid,                          -- cookie/sessionStorage anonyme
  site_id                 text not null,                 -- ex: "document-extractor"

  -- Type et statut
  consent_type            text not null check (consent_type in (
                            'analytics',
                            'ads',
                            'prospection',                -- emails commerciaux propres
                            'partners',                   -- partage avec tiers
                            'data_enrichment',            -- enrichir via APIs externes
                            'audience_activation'         -- ad-tech
                          )),
  status                  text not null check (status in (
                            'granted',
                            'denied',
                            'revoked'                     -- état après retrait
                          )),

  -- Preuve
  legal_text_version      text not null,                 -- ex: "v2026-01-CGU-FR"
  legal_basis             text not null check (legal_basis in (
                            'consent',                    -- art 6.1.a RGPD
                            'contract',                   -- art 6.1.b
                            'legal_obligation',           -- art 6.1.c
                            'vital_interest',             -- art 6.1.d
                            'public_interest',            -- art 6.1.e
                            'legitimate_interest'         -- art 6.1.f (impose un test mis-en-balance)
                          )),
  collection_page         text,                          -- URL où le consent a été donné
  collection_method       text not null check (collection_method in (
                            'opt_in_unchecked_box',       -- case à cocher non pré-cochée
                            'opt_in_button',              -- bouton "j'accepte"
                            'opt_in_double',              -- email de confirmation
                            'opt_out_link',               -- lien de désabonnement utilisé
                            'api_revocation',             -- /api/consent/revoke
                            'manual_admin'                -- modifié à la main par un admin
                          )),

  -- Audit
  collected_at            timestamptz not null default now(),
  ip_hash                 text,                          -- sha256 de l'IP (pour preuve, pas l'IP brute)
  user_agent_hash         text,                          -- sha256 du UA
  collected_by_admin_id   uuid,                          -- si manual_admin

  -- Métadonnées libres
  metadata                jsonb not null default '{}'
);

create index if not exists consent_ledger_contact_idx on consent_ledger(contact_id) where contact_id is not null;
create index if not exists consent_ledger_visitor_idx on consent_ledger(visitor_id) where visitor_id is not null;
create index if not exists consent_ledger_site_idx on consent_ledger(site_id);
create index if not exists consent_ledger_collected_idx on consent_ledger(collected_at desc);
create index if not exists consent_ledger_active_idx on consent_ledger(contact_id, consent_type, status)
  where contact_id is not null;

-- ----------------------------------------------------------------------------
-- Vue : statut de consentement courant par contact + type
-- ----------------------------------------------------------------------------
-- Last-write-wins par (contact, type). Cette vue est la SOURCE de vérité
-- pour répondre "est-ce que ce contact a consenti à X aujourd'hui ?".
create or replace view current_consents as
select distinct on (contact_id, consent_type)
  contact_id,
  consent_type,
  status,
  legal_text_version,
  legal_basis,
  collection_method,
  collected_at as last_changed_at
from consent_ledger
where contact_id is not null
order by contact_id, consent_type, collected_at desc;

comment on view current_consents is
  'Source de vérité pour le statut de consentement courant. UN consent par (contact, type).';

-- ----------------------------------------------------------------------------
-- Fonction : a-t-on un consentement actif d'un contact pour un type donné ?
-- ----------------------------------------------------------------------------
create or replace function has_active_consent(
  p_contact_id uuid,
  p_type text
) returns boolean
language sql
stable
as $$
  select coalesce(
    (select status = 'granted' from current_consents
      where contact_id = p_contact_id and consent_type = p_type limit 1),
    false
  );
$$;

comment on function has_active_consent is
  'Renvoie true si un consentement granted existe pour (contact, type). false si denied, revoked ou inexistant.';

-- ----------------------------------------------------------------------------
-- Trigger : append-only — on n'autorise JAMAIS UPDATE/DELETE
-- ----------------------------------------------------------------------------
create or replace function consent_ledger_block_modification()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consent_ledger is append-only — INSERT a new row instead';
end;
$$;

drop trigger if exists consent_ledger_no_update on consent_ledger;
create trigger consent_ledger_no_update
  before update on consent_ledger
  for each row execute function consent_ledger_block_modification();

drop trigger if exists consent_ledger_no_delete on consent_ledger;
create trigger consent_ledger_no_delete
  before delete on consent_ledger
  for each row execute function consent_ledger_block_modification();

-- Note : l'effacement RGPD ("droit à l'oubli") se fait en supprimant le
-- contact (CASCADE), pas les lignes consent_ledger. Pour un audit RGPD on
-- peut prouver qu'on a bien collecté le consentement, même après effacement.
