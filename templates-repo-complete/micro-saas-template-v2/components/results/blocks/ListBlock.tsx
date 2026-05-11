import type { ListBlock as T } from '@/config/result.schema';

export default function ListBlock({ block }: { block: T }) {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-2 font-semibold">{block.title}</h3>
      <Tag className={`pl-5 text-sm text-gray-800 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
        {block.items.map((item, i) => (
          <li key={i} className="mb-1">{item}</li>
        ))}
      </Tag>
    </div>
  );
}
