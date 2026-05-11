type Props = {
  productName: string;
  totalSellable: number;
  soldThisMonth: number;
  blockedExportCount: number;
};

export default function DataProductCard({
  productName,
  totalSellable,
  soldThisMonth,
  blockedExportCount,
}: Props) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold text-sm">{productName}</h4>
      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
        <div>
          <div className="text-xs text-gray-500">Eligible</div>
          <div className="font-mono">{totalSellable}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Sold (mo)</div>
          <div className="font-mono">{soldThisMonth}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Blocked</div>
          <div className={`font-mono ${blockedExportCount > 0 ? 'text-orange-700' : ''}`}>
            {blockedExportCount}
          </div>
        </div>
      </div>
    </div>
  );
}
