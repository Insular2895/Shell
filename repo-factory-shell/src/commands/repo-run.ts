import chalk from 'chalk';
import { execaCommand } from 'execa';

/**
 * repoRunCmd — run a dev workflow on a repo (lint, typecheck, tests)
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function repoRunCmd(...args: unknown[]): Promise<void> {
  const target = String(args[0] ?? '.');
  const checks = ['npm run lint --if-present', 'npm run typecheck --if-present', 'npm test --if-present'];
  let failed = false;
  for (const cmd of checks) {
    console.log(chalk.blue(cmd));
    const { stdout, stderr, exitCode } = await execaCommand(cmd, { cwd: target, shell: true, reject: false });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (exitCode !== 0) failed = true;
  }
  if (failed) process.exitCode = 1;
}
