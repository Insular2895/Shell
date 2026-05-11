/**
 * detect-security-findings.ts
 * Read latest security report from reports/security/ and surface HIGH/CRITICAL as tasks.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type SecurityFinding = {
  id: string;
  title: string;
  severity: 'HIGH' | 'CRITICAL';
  source: 'gitleaks' | 'semgrep' | 'osv' | 'trivy';
  file?: string;
  description: string;
};

export async function detectSecurityFindings(reportsDir: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  // Gitleaks
  try {
    const data = JSON.parse(await fs.readFile(path.join(reportsDir, 'gitleaks.json'), 'utf-8'));
    for (const f of data) {
      findings.push({
        id: `GITLEAKS-${f.RuleID}`,
        title: `Secret detected: ${f.Description}`,
        severity: 'CRITICAL',
        source: 'gitleaks',
        file: `${f.File}:${f.StartLine}`,
        description: f.Description,
      });
    }
  } catch { /* report missing */ }

  // OSV
  try {
    const data = JSON.parse(await fs.readFile(path.join(reportsDir, 'osv.json'), 'utf-8'));
    for (const r of data.results ?? []) {
      for (const p of r.packages ?? []) {
        for (const v of p.vulnerabilities ?? []) {
          findings.push({
            id: `OSV-${v.id}`,
            title: `Vulnerable dep: ${p.package?.name}`,
            severity: 'HIGH',
            source: 'osv',
            description: v.summary || v.id,
          });
        }
      }
    }
  } catch { /* report missing */ }

  return findings;
}
