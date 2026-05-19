import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * productPortCmd — port a feature directory into an existing template instance
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function productPortCmd(...args: unknown[]): Promise<void> {
  const featureDir = path.resolve(String(args[0] ?? ''));
  const templateDir = path.resolve(String(args[1] ?? ''));
  if (!featureDir || !templateDir) throw new Error('product:port expects <feature-dir> <template-dir>');
  const summary = {
    featureDir,
    templateDir,
    generated_at: new Date().toISOString(),
    manual_steps: [
      'Review feature contracts',
      'Patch config/run.schema.json',
      'Patch engine/adapter.py',
      'Run npm run ci',
    ],
  };
  await fs.writeFile(path.join(templateDir, 'PORT_PLAN.generated.json'), JSON.stringify(summary, null, 2), 'utf-8');
  console.log(chalk.green(`Port plan written in ${templateDir}`));
}
