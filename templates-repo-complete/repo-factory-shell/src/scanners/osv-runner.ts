import { execaCommand } from 'execa';
export async function runOsv(target: string) {
  const { exitCode } = await execaCommand(`bash tools/scanners/osv.sh ${target}`, { stdio: 'inherit', reject: false });
  return { exitCode, reportPath: 'reports/security/osv.json' };
}
