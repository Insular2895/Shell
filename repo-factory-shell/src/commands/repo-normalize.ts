import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * repoNormalizeCmd — normalize the repo structure to factory conventions
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function repoNormalizeCmd(...args: unknown[]): Promise<void> {
  const target = path.resolve(String(args[0] ?? '.'));
  await fs.mkdir(path.join(target, 'reports'), { recursive: true });
  await fs.mkdir(path.join(target, 'docs', 'decisions'), { recursive: true });
  await fs.mkdir(path.join(target, '.github', 'workflows'), { recursive: true });
  await ensureFile(path.join(target, 'SECURITY.md'), '# Security\n\nReport vulnerabilities privately to the maintainers.\n');
  await ensureFile(path.join(target, 'docs', 'decisions', 'ADR-0001-template.md'), '# ADR-0001\n\nStatus: proposed\n');
  console.log(chalk.green(`Normalized ${target}`));
}

async function ensureFile(file: string, content: string) {
  try {
    await fs.stat(file);
  } catch {
    await fs.writeFile(file, content, 'utf-8');
  }
}
