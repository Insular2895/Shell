-- finance-ledger/schema/pnl-by-site.sql
-- Vue mart_pnl_by_site est définie dans factory-control-center/database/schema.sql.
-- Ici on ajoute des vues plus détaillées pour reporting.

-- P&L mensuel détaillé par site
create or replace view pnl_monthly_detailed as
select
  s.site_id,
  s.name,
  date_trunc('month', r.occurred_at) as month,
  -- Revenus par source
  coalesce(sum(r.amount_eur) filter (where r.source = 'stripe_subscription'), 0) as rev_subscription,
  coalesce(sum(r.amount_eur) filter (where r.source = 'stripe_oneshot'), 0) as rev_oneshot,
  coalesce(sum(r.amount_eur) filter (where r.source = 'lead_sale'), 0) as rev_lead_sale,
  coalesce(sum(r.amount_eur) filter (where r.source = 'api_data'), 0) as rev_api,
  coalesce(sum(r.amount_eur), 0) as rev_total,
  -- Coûts directs
  coalesce(sum(e.amount_eur) filter (where not e.is_shared), 0) as cost_direct,
  -- Marge brute
  coalesce(sum(r.amount_eur) - sum(e.amount_eur) filter (where not e.is_shared), 0) as margin_eur
from sites s
left join revenues r on r.site_id = s.site_id
left join expenses e on e.site_id = s.site_id and date_trunc('month', e.occurred_at) = date_trunc('month', r.occurred_at)
group by s.site_id, s.name, date_trunc('month', r.occurred_at);
