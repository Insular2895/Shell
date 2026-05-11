/**
 * repo-metadata.ts — extract metadata from a local repo (package.json, pyproject, etc.).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type LocalMeta = {
  has_package_json: boolean;
  has_pyproject: boolean;
  has_dockerfile: boolean;
  has_supabase_dir: boolean;
  has_claude_md: boolean;
  detected_stack: string[];
};

export async function localMeta(repoPath: string): Promise<LocalMeta> {
  const exists = async (p: string) => fs.access(path.join(repoPath, p)).then(() => true).catch(() => false);

  const stack: string[] = [];
  if (await exists('package.json')) stack.push('node');
  if (await exists('pyproject.toml')) stack.push('python-pyproject');
  if (await exists('requirements.txt')) stack.push('python-pip');
  if (await exists('Cargo.toml')) stack.push('rust');
  if (await exists('go.mod')) stack.push('go');
  if (await exists('next.config.mjs') || await exists('next.config.js')) stack.push('nextjs');
  if (await exists('supabase')) stack.push('supabase');

  return {
    has_package_json: await exists('package.json'),
    has_pyproject: await exists('pyproject.toml'),
    has_dockerfile: await exists('Dockerfile'),
    has_supabase_dir: await exists('supabase'),
    has_claude_md: await exists('CLAUDE.md'),
    detected_stack: stack,
  };
}
