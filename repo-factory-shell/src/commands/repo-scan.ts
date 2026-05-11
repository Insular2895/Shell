import chalk from 'chalk';

/**
 * repoScanCmd — run all security scanners on a repo (delegates to tools/scanners/run-all.sh)
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function repoScanCmd(...args: unknown[]): Promise<void> {
  console.log(chalk.yellow(`[stub] repoScanCmd called with`), args);
  console.log(chalk.gray('Phase 1 — implementation pending. See README and AGENT_RULES.md for the spec.'));
}
