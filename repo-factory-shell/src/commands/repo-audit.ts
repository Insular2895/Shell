import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { writeReport } from '../reports/report-writer.js';

/**
 * repoAuditCmd — audit a local repo's stack, deps, security posture
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function repoAuditCmd(...args: unknown[]): Promise<void> {
  const target = path.resolve(String(args[0] ?? '.'));
  const files = await fs.readdir(target, { recursive: true });
  const packageFiles = files.filter((f) => String(f).endsWith('package.json'));
  const routeFiles = files.filter((f) => /app\/api\/.+\/route\.ts$/.test(String(f)));
  const sqlFiles = files.filter((f) => String(f).endsWith('.sql'));
  const todoFiles = files.filter((f) => /\.(ts|tsx|js|jsx|py|sql|md)$/.test(String(f)));

  let todoCount = 0;
  for (const file of todoFiles.slice(0, 5000)) {
    const content = await fs.readFile(path.join(target, String(file)), 'utf-8').catch(() => '');
    todoCount += (content.match(/\b(TODO|FIXME|XXX)\b/g) ?? []).length;
  }

  const report = [
    '# Repo audit',
    '',
    `Target: \`${target}\``,
    '',
    '| Signal | Count |',
    '|---|---:|',
    `| package.json files | ${packageFiles.length} |`,
    `| Next API routes | ${routeFiles.length} |`,
    `| SQL files | ${sqlFiles.length} |`,
    `| TODO/FIXME/XXX markers | ${todoCount} |`,
    '',
    '## Recommendation',
    '',
    todoCount > 0
      ? 'Resolve or issue-link TODO/FIXME markers before production release.'
      : 'No TODO/FIXME markers found in scanned files.',
  ].join('\n');

  const out = await writeReport('repo-audit.md', report);
  console.log(chalk.green(`Audit written to ${out}`));
}
