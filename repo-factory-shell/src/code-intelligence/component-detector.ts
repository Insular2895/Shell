/**
 * component-detector.ts — detect React components.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type DetectedComponent = { name: string; file: string; is_default_export: boolean };

export async function detectComponents(repoPath: string): Promise<DetectedComponent[]> {
  const out: DetectedComponent[] = [];
  for (const dir of ['components', 'app']) {
    const target = path.join(repoPath, dir);
    try {
      const files = (await fs.readdir(target, { recursive: true })) as string[];
      for (const f of files) {
        if (!f.endsWith('.tsx')) continue;
        const filePath = path.join(target, f);
        const content = await fs.readFile(filePath, 'utf-8');
        const match = content.match(/export\s+(default\s+)?function\s+(\w+)/);
        if (match) {
          out.push({ name: match[2], file: filePath, is_default_export: !!match[1] });
        }
      }
    } catch {
      /* dir missing */
    }
  }
  return out;
}
