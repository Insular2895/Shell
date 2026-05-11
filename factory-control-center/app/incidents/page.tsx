export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Incidents</h1>
      <p className="text-gray-500">
        Liste des incidents (P0-P3) depuis <code>incidents</code> table.
        Phase 4 — connecter <code>/api/incidents</code>.
      </p>
    </main>
  );
}
