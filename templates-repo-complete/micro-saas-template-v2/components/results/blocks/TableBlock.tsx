import type { TableBlock as T } from '@/config/result.schema';

export default function TableBlock({ block }: { block: T }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold">{block.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {block.columns.map((c) => (
                <th key={c} className="py-2 pr-4 text-left font-medium text-gray-700">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="py-2 pr-4 text-gray-800">{String(cell ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
