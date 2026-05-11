'use client';

/**
 * AutoResultRenderer
 *
 * Reçoit le `result` retourné par n'importe quel moteur et le rend visuellement.
 * Le frontend ne sait JAMAIS quel produit il rend — il connaît juste les types
 * de blocks.
 *
 * Pour ajouter un nouveau type de block, modifie :
 *   1. config/result.schema.ts (ajouter le type)
 *   2. components/results/blocks/ (créer le composant)
 *   3. ce fichier (le câbler)
 *
 * Ne JAMAIS faire ça dans un produit dérivé. C'est du Shell.
 */

import type { RunResult, ResultBlock } from '@/config/result.schema';
import TextBlock from './blocks/TextBlock';
import ScoreBlock from './blocks/ScoreBlock';
import TableBlock from './blocks/TableBlock';
import ListBlock from './blocks/ListBlock';
import FileBlock from './blocks/FileBlock';
import ChartBlock from './blocks/ChartBlock';
import JsonBlock from './blocks/JsonBlock';
import WarningBlock from './blocks/WarningBlock';
import RecommendationBlock from './blocks/RecommendationBlock';

type Props = {
  result: RunResult;
};

export default function AutoResultRenderer({ result }: Props) {
  if (result.status === 'error') {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4">
        <h3 className="font-semibold text-red-900">Erreur pendant le traitement</h3>
        <p className="mt-1 text-sm text-red-800">{result.error || 'Erreur inconnue'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {result.blocks.map((block, i) => (
        <div key={i}>{renderBlock(block)}</div>
      ))}
      {result.metadata?.durationMs !== undefined && (
        <p className="text-xs text-gray-500">
          Traitement réalisé en {Math.round((result.metadata.durationMs as number) / 1000)}s
        </p>
      )}
    </div>
  );
}

function renderBlock(block: ResultBlock) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'score':
      return <ScoreBlock block={block} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    case 'file':
      return <FileBlock block={block} />;
    case 'chart':
      return <ChartBlock block={block} />;
    case 'json':
      return <JsonBlock block={block} />;
    case 'warning':
      return <WarningBlock block={block} />;
    case 'recommendation':
      return <RecommendationBlock block={block} />;
    default:
      // Type inconnu : ne plante pas, log et affiche un avertissement
      console.warn('Unknown block type:', block);
      return (
        <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          Type de block inconnu — vérifie que le moteur respecte le contrat.
        </div>
      );
  }
}
