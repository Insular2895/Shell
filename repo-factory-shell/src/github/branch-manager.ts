/**
 * branch-manager.ts — local branch operations via git CLI.
 */
import { execaCommand } from 'execa';

export async function createBranch(name: string, fromMain = true): Promise<void> {
  if (fromMain) await execaCommand('git checkout main && git pull');
  await execaCommand(`git checkout -b ${name}`);
}

export async function currentBranch(): Promise<string> {
  const { stdout } = await execaCommand('git rev-parse --abbrev-ref HEAD');
  return stdout.trim();
}
