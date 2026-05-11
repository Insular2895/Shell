type Quota = { provider: string; used_pct: number; limit_label: string };

export default function QuotaWidget({ quotas }: { quotas: Quota[] }) {
  return (
    <div className="space-y-2">
      {quotas.map((q) => (
        <div key={q.provider} className="text-sm">
          <div className="flex justify-between">
            <span>{q.provider}</span>
            <span className={`${q.used_pct > 80 ? 'text-red-700' : 'text-gray-600'}`}>
              {q.used_pct}% / {q.limit_label}
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-1 mt-0.5">
            <div
              className={`h-1 rounded-full ${q.used_pct > 80 ? 'bg-red-600' : q.used_pct > 60 ? 'bg-yellow-600' : 'bg-green-600'}`}
              style={{ width: `${Math.min(q.used_pct, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
