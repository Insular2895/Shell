/**
 * result.schema.ts
 *
 * ⚠️ FICHIER FIGÉ — NE PAS MODIFIER PAR PRODUIT.
 *
 * Définit les types de blocks que le moteur peut retourner.
 * Le frontend (AutoResultRenderer) sait rendre exactement ces types.
 *
 * Ajouter un nouveau type ici = changement du Shell, à faire dans le template
 * principal, pas dans un produit dérivé.
 */

export type ResultBlock =
  | TextBlock
  | ScoreBlock
  | TableBlock
  | ListBlock
  | FileBlock
  | ChartBlock
  | JsonBlock
  | WarningBlock
  | RecommendationBlock;

export type TextBlock = {
  type: 'text';
  title: string;
  content: string;          // markdown supporté
};

export type ScoreBlock = {
  type: 'score';
  title: string;
  value: number;            // 0-100
  label?: string;           // ex: "Excellent", "À améliorer"
  color?: 'green' | 'orange' | 'red' | 'auto';
};

export type TableBlock = {
  type: 'table';
  title: string;
  columns: string[];
  rows: Array<Array<string | number | boolean | null>>;
};

export type ListBlock = {
  type: 'list';
  title: string;
  items: string[];
  ordered?: boolean;
};

export type FileBlock = {
  type: 'file';
  title: string;
  url: string;              // URL signée (Supabase Storage typiquement)
  mime?: string;            // ex: "application/pdf"
  filename?: string;        // ex: "rapport.pdf"
  sizeBytes?: number;
};

export type ChartBlock = {
  type: 'chart';
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKeys: string[];
};

export type JsonBlock = {
  type: 'json';
  title: string;
  data: unknown;            // payload arbitraire, affiché replié
  collapsed?: boolean;
};

export type WarningBlock = {
  type: 'warning';
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
};

export type RecommendationBlock = {
  type: 'recommendation';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionUrl?: string;
};

export type RunResult = {
  status: 'success' | 'error';
  blocks: ResultBlock[];
  error?: string;
  metadata?: {
    durationMs?: number;
    cost?: number;
    [key: string]: unknown;
  };
};
