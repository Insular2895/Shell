/**
 * import-graph.ts — build a graph of imports between files.
 * Phase 2 — needs tree-sitter or simple regex.
 */
export type ImportEdge = { from: string; to: string };

export async function buildImportGraph(_repoPath: string): Promise<ImportEdge[]> {
  console.log('[import-graph] Phase 2 implementation');
  return [];
}
