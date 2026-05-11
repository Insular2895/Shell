type Incident = {
  id: string;
  site_id?: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3' | 'info';
  status: string;
  title: string;
  detected_at: string;
};

const SEV_COLORS: Record<Incident['severity'], string> = {
  P0: 'text-red-700 bg-red-50',
  P1: 'text-orange-700 bg-orange-50',
  P2: 'text-yellow-700 bg-yellow-50',
  P3: 'text-blue-700 bg-blue-50',
  info: 'text-gray-700 bg-gray-50',
};

export default function IncidentTable({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return <div className="text-sm text-gray-500 italic p-4">No open incidents.</div>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-gray-600 border-b">
        <tr>
          <th className="text-left py-2">Severity</th>
          <th className="text-left">Site</th>
          <th className="text-left">Title</th>
          <th className="text-left">Detected</th>
        </tr>
      </thead>
      <tbody>
        {incidents.map((i) => (
          <tr key={i.id} className="border-b hover:bg-gray-50">
            <td className="py-2">
              <span className={`px-2 py-0.5 rounded text-xs ${SEV_COLORS[i.severity]}`}>{i.severity}</span>
            </td>
            <td className="text-xs text-gray-600">{i.site_id ?? '—'}</td>
            <td>{i.title}</td>
            <td className="text-xs text-gray-500">{new Date(i.detected_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
