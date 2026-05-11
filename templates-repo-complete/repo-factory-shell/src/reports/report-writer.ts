/**
 * report-writer.ts — write structured reports to reports/.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function writeReport(name: string, content: string): Promise<string> {
  const reportsDir = process.env.FACTORY_REPORTS_DIR ?? 'reports';
  await fs.mkdir(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, name);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}
