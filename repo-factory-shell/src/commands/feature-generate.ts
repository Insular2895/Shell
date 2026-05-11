import chalk from 'chalk';

/**
 * featureGenerateCmd — generate a feature blueprint from a description, URL, or screenshot
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function featureGenerateCmd(...args: unknown[]): Promise<void> {
  console.log(chalk.yellow(`[stub] featureGenerateCmd called with`), args);
  console.log(chalk.gray('Phase 1 — implementation pending. See README and AGENT_RULES.md for the spec.'));
}
