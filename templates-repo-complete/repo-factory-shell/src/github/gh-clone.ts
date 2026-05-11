/**
 * gh-clone.ts — clone a repo via `gh repo clone`.
 */
import { execaCommand } from 'execa';
import path from 'node:path';

export async function ghClone(slug: string, dest?: string): Promise<string> {
  const target = dest ?? path.basename(slug);
  await execaCommand(`gh repo clone ${slug} ${target}`, { stdio: 'inherit' });
  return target;
}
