import Link from 'next/link';
import { signup } from '../login/actions';

export default function SignupPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; check_email?: string }> }) {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Créer un compte</h1>

      <Banner searchParams={searchParams} />

      <form action={signup} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
          <input id="password" name="password" type="password" minLength={8} required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <button type="submit"
          className="w-full rounded-md bg-black px-4 py-2 font-medium text-white">
          Créer mon compte
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Déjà un compte ? <Link href="/login" className="underline">Se connecter</Link>
      </p>
    </main>
  );
}

async function Banner({ searchParams }: { searchParams: Promise<{ error?: string; check_email?: string }> }) {
  const sp = await searchParams;
  if (sp.check_email) {
    return (
      <div className="mt-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
        Vérifie ta boîte mail pour confirmer ton compte.
      </div>
    );
  }
  if (sp.error) {
    return (
      <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        {sp.error}
      </div>
    );
  }
  return null;
}
