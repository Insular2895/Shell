/**
 * gh-pr-create.ts — open a PR via `gh pr create`.
 */
import { execaCommand } from 'execa';

export type PrInput = { title: string; body: string; base?: string; draft?: boolean };

export async function ghPrCreate(opts: PrInput): Promise<string> {
  const flags = [
    `--title "${opts.title.replace(/"/g, '\\"')}"`,
    `--body "${opts.body.replace(/"/g, '\\"')}"`,
    opts.base ? `--base ${opts.base}` : '',
    opts.draft ? '--draft' : '',
  ].filter(Boolean).join(' ');

  const { stdout } = await execaCommand(`gh pr create ${flags}`);
  return stdout.trim();
}
