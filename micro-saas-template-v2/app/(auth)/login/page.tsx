import Link from 'next/link';
import { login } from './actions';

export default function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; redirect?: string }> }) {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Connexion</h1>

      <ErrorBanner searchParams={searchParams} />

      <form action={login} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
          <input id="password" name="password" type="password" required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <button type="submit"
          className="w-full rounded-md bg-black px-4 py-2 font-medium text-white">
          Se connecter
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Pas encore de compte ? <Link href="/signup" className="underline">Créer un compte</Link>
      </p>
    </main>
  );
}

async function ErrorBanner({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  if (!sp.error) return null;
  return (
    <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      {sp.error}
    </div>
  );
}
