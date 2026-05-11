export const dynamic = 'force-dynamic';

export default async function DecisionsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Decisions à valider</h1>
      <p className="text-gray-500">
        Liste des décisions <code>ask_before</code> en attente de validation
        humaine. Cf <code>agent-quality-system/policies/approval-policy.yml</code>.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Phase 4 — connecter <code>/api/decisions</code> + actions approve/reject.
      </p>
    </main>
  );
}
