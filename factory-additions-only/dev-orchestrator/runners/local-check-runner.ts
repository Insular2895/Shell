/**
 * local-check-runner.ts
 * Lance les checks locaux post-task pour valider qu'une tâche est mergeable.
 */
import { execaCommand } from 'execa';

export type CheckResult = { name: string; passed: boolean; output: string };

export async function runChecks(repoPath: string): Promise<CheckResult[]> {
  const checks: { name: string; cmd: string }[] = [
    { name: 'lint', cmd: 'npm run lint' },
    { name: 'typecheck', cmd: 'npm run typecheck' },
    { name: 'test', cmd: 'npm test -- --run' },
    { name: 'gitleaks', cmd: 'bash tools/scanners/gitleaks.sh .' },
  ];

  const results: CheckResult[] = [];
  for (const c of checks) {
    try {
      const { stdout, stderr } = await execaCommand(c.cmd, { cwd: repoPath, reject: false });
      results.push({ name: c.name, passed: true, output: (stdout + stderr).slice(0, 1000) });
    } catch (e) {
      results.push({
        name: c.name,
        passed: false,
        output: (e instanceof Error ? e.message : 'unknown').slice(0, 1000),
      });
    }
  }
  return results;
}
