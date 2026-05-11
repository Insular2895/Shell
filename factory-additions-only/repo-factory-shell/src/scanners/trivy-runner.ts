import { execaCommand } from 'execa';
export async function runTrivy(target: string) {
  const { exitCode } = await execaCommand(`bash tools/scanners/trivy.sh ${target}`, { stdio: 'inherit', reject: false });
  return { exitCode, reportPath: 'reports/security/trivy.json' };
}
