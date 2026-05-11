import type { WarningBlock as T } from '@/config/result.schema';

export default function WarningBlock({ block }: { block: T }) {
  const styles =
    block.severity === 'critical' ? 'border-red-300 bg-red-50 text-red-900' :
    block.severity === 'warning' ? 'border-orange-300 bg-orange-50 text-orange-900' :
    'border-blue-300 bg-blue-50 text-blue-900';
  return (
    <div className={`rounded-md border p-4 ${styles}`}>
      <h3 className="font-semibold">{block.title}</h3>
      <p className="mt-1 text-sm">{block.message}</p>
    </div>
  );
}
