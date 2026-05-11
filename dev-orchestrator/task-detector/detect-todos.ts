/**
 * detect-todos.ts
 * Scan repo for TODO/FIXME/XXX comments without an associated issue number.
 * Output : array of dev-task entries conforming to dev-tasks.schema.json
 */
import { execaCommand } from 'execa';

export type DetectedTodo = {
  id: string;
  title: string;
  file: string;
  line: number;
  text: string;
  has_issue_ref: boolean;
};

export async function detectTodos(repoPath: string): Promise<DetectedTodo[]> {
  // Use ripgrep if available, else grep
  const cmd = `rg -n --no-heading --type-add 'web:*.{ts,tsx,js,jsx,py,sql,md}' -t web '(TODO|FIXME|XXX)' ${repoPath} || true`;
  const { stdout } = await execaCommand(cmd, { shell: true });
  if (!stdout) return [];

  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      const m = line.match(/^([^:]+):(\d+):(.+)$/);
      if (!m) return null;
      const [, file, lineNoStr, text] = m;
      const has_issue_ref = /#\d+/.test(text);
      return {
        id: `TODO-${String(i).padStart(4, '0')}`,
        title: text.slice(0, 80).trim(),
        file,
        line: Number(lineNoStr),
        text: text.trim(),
        has_issue_ref,
      };
    })
    .filter((t): t is DetectedTodo => t !== null && !t.has_issue_ref);
}
