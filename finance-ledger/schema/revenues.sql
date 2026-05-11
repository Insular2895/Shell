-- finance-ledger/schema/revenues.sql
-- Renvoie au schema central : factory-control-center/database/schema.sql (table 'revenues').
-- Cette implémentation cohabite avec factory-control-center pour ne pas dupliquer.
-- Si un site_id n'existe pas dans factory-control-center.sites : insertion refusée par FK.

-- Vue spécifique finance : revenu mensuel par source
create or replace view revenue_by_source_monthly as
select
  site_id,
  source,
  date_trunc('month', occurred_at) as month,
  sum(amount_eur) as total_eur,
  count(*) as count
from revenues
group by site_id, source, date_trunc('month', occurred_at);
