import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeReport } from './report-writer';

let dir: string | null = null;

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = null;
  delete process.env.FACTORY_REPORTS_DIR;
});

describe('writeReport', () => {
  it('writes reports to FACTORY_REPORTS_DIR', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'factory-reports-'));
    process.env.FACTORY_REPORTS_DIR = dir;

    const file = await writeReport('audit.md', '# Audit');

    expect(file).toBe(path.join(dir, 'audit.md'));
    await expect(readFile(file, 'utf-8')).resolves.toBe('# Audit');
  });
});
