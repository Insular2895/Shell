import chalk from 'chalk';
import { writeReport } from '../reports/report-writer.js';

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
  const spec = String(args[0] ?? '').trim();
  if (!spec) throw new Error('feature:generate expects a description, URL, or screenshot path');
  const slug = spec.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'feature';
  const blueprint = [
    `# Feature blueprint: ${slug}`,
    '',
    '## Intent',
    spec,
    '',
    '## Contracts',
    '- UI states: loading, empty, error, success',
    '- API inputs validated server-side',
    '- Security rules documented before implementation',
    '',
    '## Acceptance Criteria',
    '- Tests cover the main user path',
    '- No PII or secrets in logs',
    '- Lint/typecheck/test/build pass',
  ].join('\n');
  const out = await writeReport(`feature-${slug}.md`, blueprint);
  console.log(chalk.green(`Blueprint written to ${out}`));
}
