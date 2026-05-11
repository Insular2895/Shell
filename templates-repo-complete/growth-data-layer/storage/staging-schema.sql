-- staging-schema.sql
-- Couche STAGING : données nettoyées/normalisées par dbt.
-- Pas de PII en clair, hash uniquement.

-- stg_contacts : tout email/phone normalisé (lowercase, +33 format) + hashé
create or replace view stg_contacts as
select
  re.visitor_id,
  -- Email hash si email collecté dans un raw_form
  (
    select encode(digest(lower(trim(rf.raw_payload->>'email')), 'sha256'), 'hex')
    from raw_forms rf
    where rf.visitor_id = re.visitor_id
      and rf.raw_payload->>'email' is not null
    order by rf.submitted_at desc limit 1
  ) as email_hash,
  (
    select encode(digest(regexp_replace(rf.raw_payload->>'phone', '\D', '', 'g'), 'sha256'), 'hex')
    from raw_forms rf
    where rf.visitor_id = re.visitor_id
      and rf.raw_payload->>'phone' is not null
    order by rf.submitted_at desc limit 1
  ) as phone_hash,
  min(re.occurred_at) as first_seen_at,
  max(re.occurred_at) as last_seen_at,
  array_agg(distinct re.site_id) as sites
from raw_events re
where re.visitor_id is not null
group by re.visitor_id;

-- stg_companies : depuis enrichissement SIREN ou domain matching
-- (à implémenter phase 6 quand on branche un enrichisseur)

-- stg_events : événements normalisés (drop des spam/bots, agrégation par session)
create or replace view stg_events as
select
  id,
  site_id,
  visitor_id,
  contact_id,
  event_type,
  event_payload - 'user_agent' - 'ip' as event_payload_clean,
  occurred_at
from raw_events
where event_type not in ('bot_detected', 'spam_filtered');
