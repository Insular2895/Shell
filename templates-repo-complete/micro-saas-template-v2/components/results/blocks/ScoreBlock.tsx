import type { ScoreBlock as T } from '@/config/result.schema';

export default function ScoreBlock({ block }: { block: T }) {
  const color =
    block.color === 'green' ? 'text-green-600' :
    block.color === 'orange' ? 'text-orange-600' :
    block.color === 'red' ? 'text-red-600' :
    block.value >= 75 ? 'text-green-600' :
    block.value >= 50 ? 'text-orange-600' :
    'text-red-600';

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-2 font-semibold">{block.title}</h3>
      <div className={`text-4xl font-bold ${color}`}>{block.value}<span className="text-lg text-gray-400">/100</span></div>
      {block.label && <p className="mt-1 text-sm text-gray-600">{block.label}</p>}
    </div>
  );
}
