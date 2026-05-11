/**
 * semgrep-runner.ts — delegates to tools/scanners/semgrep.sh
 */
import { execaCommand } from 'execa';

export async function runSemgrep(target: string): Promise<{ exitCode: number; reportPath: string }> {
  const { exitCode } = await execaCommand(`bash tools/scanners/semgrep.sh ${target}`, {
    stdio: 'inherit',
    reject: false,
  });
  return { exitCode, reportPath: 'reports/security/semgrep.json' };
}
