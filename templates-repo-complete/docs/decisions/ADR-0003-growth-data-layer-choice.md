# ADR-0003 — Growth data layer : Postgres + Splink

## Status
Accepted (2026-05-09)

## Context
Couche data unifiée multi-sites :
- Tracking events
- Identity resolution
- Consent ledger
- Sellable marts

Options :
- Postgres + dbt + Splink (open source)
- Snowflake / BigQuery + Hightouch (managed)
- Custom Python pipeline

## Decision
**Postgres + dbt + Splink (open-source)** pour MVP. Hightouch envisageable si activation publicitaire à grande échelle.

## Consequences
- ✅ Coût bas (Postgres existant)
- ✅ Splink éprouvé pour identity resolution probabiliste
- ✅ Append-only enforcé au niveau triggers DB
- ⚠️ Volume limite : si > 10M leads, considérer warehouse dédié (DuckDB/Clickhouse)

## Review
Si > 1M leads ou > 100GB data : ré-évaluer.
