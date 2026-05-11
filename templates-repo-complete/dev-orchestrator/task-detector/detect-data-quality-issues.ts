/**
 * detect-data-quality-issues.ts
 * SQL queries against growth-data-layer to find data quality issues.
 * Result : tasks to fix or alerts.
 */
export type DataQualityIssue = {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  query: string;
  count_or_sample: unknown;
};

// Intentionally returns mock until DB connection is wired in phase 6.
export async function detectDataQualityIssues(): Promise<DataQualityIssue[]> {
  return [
    // Example issues this would surface :
    // - Leads with sellable_status='eligible' AND opt_out=true (incohérence)
    // - Leads avec retention_expires_at <= now() AND sellable_status='eligible'
    // - Consent_ledger avec status='granted' ET legal_basis='consent' ET method='opt_out_link'
    // - Master_contacts avec email en clair (devrait être hashé)
  ];
}
