/**
 * score-normalizer.ts — normalize various scanner outputs to a unified score.
 */
export type NormalizedScore = {
  severity_max: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  counts: Record<string, number>;
};

export function normalizeScores(counts: Record<string, number>): NormalizedScore {
  let severity_max: NormalizedScore['severity_max'] = 'LOW';
  if (counts.gitleaks > 0) severity_max = 'CRITICAL';
  else if (counts.semgrep_error > 0 || counts.osv_high > 0 || counts.trivy_high > 0) severity_max = 'HIGH';
  else if (counts.semgrep_warning > 0) severity_max = 'MEDIUM';
  return { severity_max, counts };
}
