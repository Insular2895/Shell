/**
 * detect-failing-tests.ts
 * Run tests, parse output, return failing tests as dev-tasks.
 */
import { execaCommand } from 'execa';

export type FailingTest = {
  id: string;
  title: string;
  file: string;
  test_name: string;
  error_summary: string;
};

export async function detectFailingTests(repoPath: string): Promise<FailingTest[]> {
  try {
    const { stdout, exitCode } = await execaCommand(
      'npm test --silent -- --reporter=json',
      { cwd: repoPath, reject: false },
    );
    if (exitCode === 0) return [];

    // Parse vitest/jest JSON output
    const lines = stdout.split('\n').filter((l) => l.trim().startsWith('{'));
    const json = JSON.parse(lines[lines.length - 1] || '{}');
    const failures: FailingTest[] = [];
    let i = 0;
    for (const result of json.testResults ?? []) {
      for (const t of result.assertionResults ?? []) {
        if (t.status === 'failed') {
          failures.push({
            id: `TEST-FAIL-${String(i).padStart(4, '0')}`,
            title: `Failing test: ${t.fullName}`,
            file: result.name,
            test_name: t.fullName,
            error_summary: (t.failureMessages?.[0] ?? '').slice(0, 200),
          });
          i++;
        }
      }
    }
    return failures;
  } catch {
    return [];
  }
}
