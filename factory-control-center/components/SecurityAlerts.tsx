type Alert = {
  id: string;
  source: 'gitleaks' | 'semgrep' | 'osv' | 'trivy' | 'sentry';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detected_at: string;
};

export default function SecurityAlerts({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <div className="text-sm text-green-700 italic">No HIGH/CRITICAL findings.</div>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {alerts.map((a) => (
        <li key={a.id} className="flex justify-between border-b py-1">
          <span>
            <span className="text-xs text-gray-500 mr-2">[{a.source}]</span>
            {a.title}
          </span>
          <span className={`text-xs font-mono ${a.severity === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}`}>
            {a.severity}
          </span>
        </li>
      ))}
    </ul>
  );
}
