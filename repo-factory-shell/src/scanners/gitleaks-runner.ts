import { execaCommand } from 'execa';
export async function runGitleaks(target: string) {
  const { exitCode } = await execaCommand(`bash tools/scanners/gitleaks.sh ${target}`, { stdio: 'inherit', reject: false });
  return { exitCode, reportPath: 'reports/security/gitleaks.json' };
}
