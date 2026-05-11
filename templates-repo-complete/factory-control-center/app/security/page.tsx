export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Security</h1>
      <p className="text-gray-500">
        Findings agrégés des derniers scans (Gitleaks, Semgrep, OSV, Trivy).
        Phase 4 — connecter au pipeline GitHub Actions <code>security-scan.yml</code>.
      </p>
    </main>
  );
}
