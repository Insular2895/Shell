export const dynamic = 'force-dynamic';

export default async function PnlPage() {
  // En production : fetch depuis /api/pnl
  // Phase 1 : page placeholder
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">P&L par site</h1>
      <p className="text-gray-500">
        Cette page affichera <code>mart_pnl_by_site</code> avec graphique mensuel
        par source revenu et catégorie de coût.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Phase 4 — connecter <code>/api/pnl</code> + graphique recharts.
      </p>
    </main>
  );
}
