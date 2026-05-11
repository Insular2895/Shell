type Decision = {
  id: string;
  decision_type: string;
  proposed_by: string;
  proposed_at: string;
  rationale: string;
  site_id?: string;
};

export default function DecisionQueue({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return <div className="text-sm text-gray-500 italic">Aucune décision en attente.</div>;
  }
  return (
    <div className="space-y-2">
      {decisions.map((d) => (
        <div key={d.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{d.decision_type}</span>
            <span>{new Date(d.proposed_at).toLocaleString()}</span>
          </div>
          <p className="mt-1">{d.rationale}</p>
          <div className="text-xs text-gray-500 mt-2">
            par {d.proposed_by}
            {d.site_id ? ` · ${d.site_id}` : ''}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
              Approve
            </button>
            <button className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">
              Reject
            </button>
            <button className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100">
              Defer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
