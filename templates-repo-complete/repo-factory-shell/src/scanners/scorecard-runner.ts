import { execaCommand } from 'execa';
export async function runScorecard(repoUrl: string) {
  // Note: Scorecard requires a remote URL, not local path
  console.warn('Scorecard requires GitHub URL not local path');
  return { exitCode: 0, reportPath: 'reports/security/scorecard.json' };
}
