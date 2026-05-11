export const dynamic = 'force-dynamic';

export default async function DataProductsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Data products</h1>
      <p className="text-gray-500">
        Stats sur <code>mart_sellable_leads</code> et exports.
      </p>
      <ul className="list-disc ml-6 mt-4 text-sm text-gray-600">
        <li>Leads collectés / mois</li>
        <li>% sellable_status='eligible'</li>
        <li>Volume vendu</li>
        <li>Top buyers</li>
        <li>Exports bloqués (raisons aggregées)</li>
      </ul>
      <p className="text-sm text-gray-400 mt-4">
        Phase 4 — connecter <code>/api/data-products</code> + <code>/api/exports/log</code>.
      </p>
    </main>
  );
}
