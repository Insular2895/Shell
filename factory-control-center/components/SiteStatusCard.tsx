type Props = {
  siteId: string;
  name: string;
  mode: 'normal' | 'degraded' | 'maintenance' | 'fallback' | 'paused';
  message?: string;
};

const MODE_COLORS: Record<Props['mode'], string> = {
  normal: 'bg-green-50 text-green-700 border-green-200',
  degraded: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
  fallback: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function SiteStatusCard({ siteId, name, mode, message }: Props) {
  return (
    <div className={`border rounded-lg p-4 ${MODE_COLORS[mode]}`}>
      <div className="flex justify-between">
        <h3 className="font-semibold">{name}</h3>
        <span className="text-xs uppercase">{mode}</span>
      </div>
      <p className="text-xs mt-1 opacity-70">{siteId}</p>
      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}
