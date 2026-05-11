-- finance-ledger/schema/expenses.sql
-- Cf factory-control-center/database/schema.sql pour la table 'expenses'.

-- Vue : coûts mensuels par catégorie et site
create or replace view expenses_by_category_monthly as
select
  site_id,
  category,
  vendor,
  date_trunc('month', occurred_at) as month,
  sum(amount_eur) as total_eur,
  is_shared
from expenses
group by site_id, category, vendor, date_trunc('month', occurred_at), is_shared;

-- Vue : coûts partagés à allouer
-- Cf finance-ledger/policies/shared-cost-policy.md pour les règles d'attribution.
create or replace view shared_costs_to_allocate as
select * from expenses where is_shared = true;
