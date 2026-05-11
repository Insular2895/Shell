/**
 * gh-auth.ts — GitHub authentication via GitHub CLI (gh).
 * Phase 1.
 */
import { execaCommand } from 'execa';

export async function isAuthenticated(): Promise<boolean> {
  try {
    await execaCommand('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
