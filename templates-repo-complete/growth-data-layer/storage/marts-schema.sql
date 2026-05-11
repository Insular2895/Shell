-- marts-schema.sql
-- Note : mart_sellable_leads est défini dans master-schema.sql (single source).
-- mart_pnl_by_site est défini dans factory-control-center/database/schema.sql.
-- Ce fichier ajoute les autres marts.

-- mart_ad_audiences : segments anonymisés activables (sans PII brute)
create or replace view mart_ad_audiences as
select
  l.source_site_id,
  comp.industry,
  comp.sector,
  comp.size_range,
  comp.country,
  l.intent_score,
  encode(digest(c.email_hash, 'sha256'), 'hex') as email_hash_for_match,
  l.consent_ads
from master_leads l
join master_contacts c on c.contact_id = l.contact_id
left join master_companies comp on comp.company_id = l.company_id
where l.consent_ads = true
  and l.opt_out is not true
  and c.opt_out is not true;

-- mart_buyer_exports : log + état des leads exportés vers les acheteurs
-- (déjà dans lead_delivery_log — ce mart aggrège par buyer pour stats)
create or replace view mart_buyer_exports as
select
  buyer_id,
  count(*) as total_leads,
  sum(price_eur) as total_revenue,
  count(*) filter (where exclusivity_type = 'exclusive') as exclusive_count,
  min(delivered_at) as first_delivery,
  max(delivered_at) as last_delivery
from lead_delivery_log
group by buyer_id;
