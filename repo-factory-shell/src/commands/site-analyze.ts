import chalk from 'chalk';
import { writeReport } from '../reports/report-writer.js';

/**
 * siteAnalyzeCmd — analyze a public URL with Playwright + Firecrawl, output cleanroom feature-map
 *
 * STATUS: skeleton (phase 1 to implement).
 * The intent is documented; the actual implementation pulls together:
 *   - GitHub API (octokit)
 *   - Tree-sitter for AST analysis
 *   - Tools/scanners shell scripts via execa
 *   - Reports written to reports/<command>/
 */
export async function siteAnalyzeCmd(...args: unknown[]): Promise<void> {
  const url = String(args[0] ?? '');
  if (!/^https?:\/\//.test(url)) throw new Error('site:analyze expects an http(s) URL');
  const res = await fetch(url, { redirect: 'follow' });
  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? url;
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ?? '';
  const report = `# Cleanroom site analysis\n\nURL: ${url}\nStatus: ${res.status}\nTitle: ${title}\nDescription: ${description}\n\nNo proprietary source code copied.\n`;
  const out = await writeReport('site-analysis.md', report);
  console.log(chalk.green(`Analysis written to ${out}`));
}
