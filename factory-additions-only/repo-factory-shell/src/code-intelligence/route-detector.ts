/**
 * route-detector.ts — detect Next.js API routes in app/api/.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type DetectedRoute = { method: string; path: string; file: string };

export async function detectRoutes(repoPath: string): Promise<DetectedRoute[]> {
  const apiDir = path.join(repoPath, 'app', 'api');
  try {
    await fs.access(apiDir);
  } catch {
    return [];
  }
  const out: DetectedRoute[] = [];
  const files = (await fs.readdir(apiDir, { recursive: true })) as string[];
  for (const f of files) {
    if (!f.endsWith('route.ts') && !f.endsWith('route.tsx')) continue;
    const filePath = path.join(apiDir, f);
    const content = await fs.readFile(filePath, 'utf-8');
    const routePath = '/' + path.dirname(f).replace(/\\/g, '/');
    for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const re = new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`);
      if (re.test(content)) out.push({ method: m, path: routePath, file: f });
    }
  }
  return out;
}
