"""
growth-data-layer/identity-resolution/splink/run-resolution.py

Phase 6 implementation. Lance Splink sur master_contacts pour produire
identity_clusters.

Usage:
    python run-resolution.py --db-url=$DATABASE_URL --threshold=0.90

Pour les scores 0.70-0.90 : INSERT dans merge_reviews (cf identities-schema.sql).
"""
import argparse
import logging
import os

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("splink-runner")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", default=os.environ.get("DATABASE_URL"))
    parser.add_argument("--auto-merge-threshold", type=float, default=0.90)
    parser.add_argument("--review-min-threshold", type=float, default=0.70)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log.info("Splink runner — phase 6 stub")
    log.info(f"DB: {args.db_url[:30] if args.db_url else 'NONE'}...")
    log.info(f"Auto-merge above: {args.auto_merge_threshold}")
    log.info(f"Review between: {args.review_min_threshold}-{args.auto_merge_threshold}")
    log.info(f"Dry-run: {args.dry_run}")
    log.info("")
    log.info("To implement (phase 6):")
    log.info("  1. pip install splink duckdb")
    log.info("  2. Load master_contacts via DuckDB (read from Postgres)")
    log.info("  3. Splink linker = DuckDBLinker(df, settings=splink-settings.json)")
    log.info("  4. predictions = linker.predict()")
    log.info("  5. clusters = linker.cluster_pairwise_predictions_at_threshold(predictions, args.auto_merge_threshold)")
    log.info("  6. INSERT auto-merges → identity_clusters")
    log.info("  7. INSERT 0.70-0.90 → merge_reviews")
    log.info("  8. Report stats → reports/identity-resolution/<date>.md")


if __name__ == "__main__":
    main()
