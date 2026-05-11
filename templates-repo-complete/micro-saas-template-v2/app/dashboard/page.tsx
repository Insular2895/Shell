import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listJobs } from '@/lib/jobs';

export default async function Dashboard() {
  const user = await requireUser();
  const jobs = await listJobs(user.id);
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes runs</h1>
        <Link href="/run" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">Nouveau run</Link>
      </div>
      <ul className="divide-y divide-gray-200">
        {jobs.map((j) => (
          <li key={j.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{new Date(j.created_at).toLocaleString('fr-FR')}</p>
              <p className="text-sm text-gray-500">{j.status}</p>
            </div>
            <Link href={`/results/${j.id}`} className="text-sm underline">Voir</Link>
          </li>
        ))}
        {jobs.length === 0 && <li className="py-6 text-center text-sm text-gray-500">Aucun run pour le moment.</li>}
      </ul>
    </main>
  );
}
