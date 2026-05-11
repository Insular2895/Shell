import type { TextBlock as T } from '@/config/result.schema';

export default function TextBlock({ block }: { block: T }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-2 font-semibold">{block.title}</h3>
      <div className="whitespace-pre-wrap text-sm text-gray-800">{block.content}</div>
    </div>
  );
}
