/**
 * detect-missing-backend-contract.ts
 * Scan API routes for missing Zod/Ajv/Pydantic input validation.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type MissingContract = {
  id: string;
  title: string;
  route: string;
  reason: string;
};

export async function detectMissingBackendContract(repoPath: string): Promise<MissingContract[]> {
  const out: MissingContract[] = [];
  const apiDir = path.join(repoPath, 'app', 'api');
  let routes: string[] = [];
  try {
    routes = (await fs.readdir(apiDir, { recursive: true })) as string[];
  } catch { return out; }

  let i = 0;
  for (const r of routes) {
    if (!r.endsWith('route.ts')) continue;
    const filePath = path.join(apiDir, r);
    const content = await fs.readFile(filePath, 'utf-8');
    if (
      content.includes('await req.json()') &&
      !/(ajv|zod|pydantic|validateRunInput)/i.test(content)
    ) {
      out.push({
        id: `BC-${String(i++).padStart(4, '0')}`,
        title: `Route without input validation: ${r}`,
        route: r,
        reason: 'await req.json() without subsequent Zod/Ajv check',
      });
    }
  }
  return out;
}
