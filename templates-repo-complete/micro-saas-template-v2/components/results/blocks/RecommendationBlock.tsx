import type { RecommendationBlock as T } from '@/config/result.schema';

export default function RecommendationBlock({ block }: { block: T }) {
  const priorityBadge =
    block.priority === 'high' ? 'bg-red-100 text-red-800' :
    block.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
    'bg-gray-100 text-gray-800';

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{block.title}</h3>
        {block.priority && (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityBadge}`}>
            {block.priority}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-700">{block.message}</p>
      {block.actionUrl && block.actionLabel && (
        <a href={block.actionUrl} className="mt-2 inline-block text-sm font-medium underline">
          {block.actionLabel}
        </a>
      )}
    </div>
  );
}
