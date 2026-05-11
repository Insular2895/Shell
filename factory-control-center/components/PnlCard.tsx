type Props = {
  siteId: string;
  revenueEur: number;
  costEur: number;
  budgetEur: number;
};

export default function PnlCard({ siteId, revenueEur, costEur, budgetEur }: Props) {
  const margin = revenueEur - costEur;
  const budgetUsedPct = budgetEur > 0 ? Math.round((costEur / budgetEur) * 100) : 0;
  const overBudget = budgetUsedPct > 80;
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold text-sm">{siteId} — P&L (this month)</h4>
      <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
        <div>
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="font-mono">{revenueEur.toFixed(2)} €</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Cost</div>
          <div className="font-mono">{costEur.toFixed(2)} €</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Margin</div>
          <div className={`font-mono ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{margin.toFixed(2)} €</div>
        </div>
      </div>
      <div className="mt-3 text-xs">
        <div className="flex justify-between">
          <span>Budget</span>
          <span className={overBudget ? 'text-red-700 font-semibold' : ''}>{budgetUsedPct}% / {budgetEur} €</span>
        </div>
        <div className="bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full ${overBudget ? 'bg-red-600' : 'bg-blue-600'}`}
            style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
