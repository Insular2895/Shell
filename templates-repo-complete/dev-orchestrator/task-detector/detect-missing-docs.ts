/**
 * detect-missing-docs.ts
 * Detect modules / packs / endpoints without README or doc.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type MissingDoc = {
  id: string;
  title: string;
  path: string;
  expected_doc: string;
};

export async function detectMissingDocs(repoPath: string): Promise<MissingDoc[]> {
  const out: MissingDoc[] = [];

  // Modules-registry: each subdir should have a README.md
  const modulesDir = path.join(repoPath, 'modules-registry');
  try {
    const entries = await fs.readdir(modulesDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const readme = path.join(modulesDir, e.name, 'spec', 'business-spec.md');
      try {
        await fs.stat(readme);
      } catch {
        out.push({
          id: `DOC-${e.name}`,
          title: `Missing business-spec.md in module ${e.name}`,
          path: readme,
          expected_doc: 'business-spec.md',
        });
      }
    }
  } catch {
    /* dir not present */
  }

  return out;
}
