/**
 * detect-ui-missing-states.ts
 * Heuristic: scan TSX components, identify ones that don't seem to handle
 * loading/error/empty states (no useState for loading, no error component, etc.).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type UiMissingState = {
  id: string;
  title: string;
  component: string;
  missing: string[];
};

export async function detectUiMissingStates(repoPath: string): Promise<UiMissingState[]> {
  const out: UiMissingState[] = [];
  const compDir = path.join(repoPath, 'components');

  let entries: string[] = [];
  try {
    entries = (await fs.readdir(compDir, { recursive: true })) as string[];
  } catch { return out; }

  let i = 0;
  for (const f of entries) {
    if (!f.endsWith('.tsx')) continue;
    const filePath = path.join(compDir, f);
    const content = await fs.readFile(filePath, 'utf-8');
    const missing: string[] = [];
    if (!/loading|isLoading|pending/i.test(content)) missing.push('loading');
    if (!/error|Error/i.test(content)) missing.push('error');
    if (!/empty|isEmpty|no.?data/i.test(content)) missing.push('empty');
    if (missing.length >= 2) {
      out.push({
        id: `UI-STATE-${String(i++).padStart(4, '0')}`,
        title: `Missing states in ${path.basename(f)}: ${missing.join(', ')}`,
        component: f,
        missing,
      });
    }
  }
  return out;
}
