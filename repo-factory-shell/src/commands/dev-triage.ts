import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execaCommand } from 'execa';

/**
 * devTriageCmd — detect dev tasks in repo (TODOs, failing tests, missing docs, security findings)
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function devTriageCmd(...args: unknown[]): Promise<void> {
  const repoPath = String(args[0] ?? process.cwd());
  const [todos, docs, security] = await Promise.all([
    detectTodos(repoPath),
    detectMissingDocs(repoPath),
    detectSecurityFindings(),
  ]);
  const tasks = [
    ...todos.map((t) => ({ type: 'todo', severity: 'MEDIUM', ...t })),
    ...docs.map((d) => ({ type: 'missing_doc', severity: 'LOW', ...d })),
    ...security.map((s) => ({ type: 'security_finding', ...s })),
  ];
  console.log(JSON.stringify({ tasks }, null, 2));
}

async function detectTodos(repoPath: string) {
  const { stdout } = await execaCommand(
    `rg -n --no-heading '(TODO|FIXME|XXX)' ${JSON.stringify(repoPath)} || true`,
    { shell: true },
  );
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^([^:]+):(\d+):(.+)$/);
      if (!match || /#\d+/.test(match[3])) return null;
      return {
        id: `TODO-${String(index).padStart(4, '0')}`,
        title: match[3].trim().slice(0, 100),
        file: match[1],
        line: Number(match[2]),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function detectMissingDocs(repoPath: string) {
  const modulesDir = path.join(repoPath, 'modules-registry');
  const out: Array<{ id: string; title: string; path: string }> = [];
  const entries = await fs.readdir(modulesDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const expected = path.join(modulesDir, entry.name, 'spec', 'business-spec.md');
    try {
      await fs.stat(expected);
    } catch {
      out.push({ id: `DOC-${entry.name}`, title: `Missing business spec for ${entry.name}`, path: expected });
    }
  }
  return out;
}

async function detectSecurityFindings() {
  const reportsDir = 'reports/security';
  const findings: Array<{ id: string; title: string; severity: string; source: string }> = [];
  const gitleaks = await readJson(path.join(reportsDir, 'gitleaks.json'));
  if (Array.isArray(gitleaks)) {
    for (const finding of gitleaks) {
      findings.push({
        id: `GITLEAKS-${finding.RuleID ?? findings.length}`,
        title: finding.Description ?? 'Secret detected',
        severity: 'CRITICAL',
        source: 'gitleaks',
      });
    }
  }
  return findings;
}

async function readJson(file: string) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as unknown;
  } catch {
    return null;
  }
}
