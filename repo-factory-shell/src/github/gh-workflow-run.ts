/**
 * gh-workflow-run.ts — trigger and follow a GitHub Actions workflow.
 */
import { execaCommand } from 'execa';

export async function ghWorkflowRun(workflow: string, ref = 'main'): Promise<void> {
  await execaCommand(`gh workflow run ${workflow} --ref ${ref}`);
}
