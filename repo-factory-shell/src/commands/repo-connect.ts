import chalk from 'chalk';

/**
 * repoConnectCmd — connect a normalized repo to a template (via adapter)
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function repoConnectCmd(...args: unknown[]): Promise<void> {
  console.log(chalk.yellow(`[stub] repoConnectCmd called with`), args);
  console.log(chalk.gray('Phase 1 — implementation pending. See README and AGENT_RULES.md for the spec.'));
}
