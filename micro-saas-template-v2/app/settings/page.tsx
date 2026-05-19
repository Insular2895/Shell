export default function Settings() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <section className="mt-6 rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold">Compte</h2>
        <p className="mt-2 text-sm text-gray-600">
          Les paramètres de profil et de sécurité sont gérés par Supabase Auth.
        </p>
      </section>
    </main>
  );
}
