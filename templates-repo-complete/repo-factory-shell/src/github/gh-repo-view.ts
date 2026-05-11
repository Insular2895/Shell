/**
 * gh-repo-view.ts — fetch repo metadata via `gh repo view --json`.
 */
import { execaCommand } from 'execa';

export type RepoMeta = {
  name: string;
  description: string;
  languages: { name: string; size: number }[];
  defaultBranchRef: { name: string };
  stargazerCount: number;
  pushedAt: string;
  isArchived: boolean;
};

export async function ghRepoView(slug: string): Promise<RepoMeta> {
  const { stdout } = await execaCommand(
    `gh repo view ${slug} --json name,description,languages,defaultBranchRef,stargazerCount,pushedAt,isArchived`,
  );
  return JSON.parse(stdout);
}
