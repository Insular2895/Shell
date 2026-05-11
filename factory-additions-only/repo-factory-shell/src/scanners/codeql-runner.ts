/**
 * codeql-runner.ts — CodeQL (phase 2 — requires CodeQL CLI).
 */
export async function runCodeQL(_target: string): Promise<{ exitCode: number; reportPath: string }> {
  console.warn('[codeql] Not implemented in phase 1 — use GitHub Code Scanning instead');
  return { exitCode: 0, reportPath: '' };
}
