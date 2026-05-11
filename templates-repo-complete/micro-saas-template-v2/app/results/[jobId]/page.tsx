'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AutoResultRenderer from '@/components/results/AutoResultRenderer';
import type { Job } from '@/lib/jobs';

export default function ResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const tick = async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;
      const data = (await res.json()) as Job;
      if (cancelled) return;
      setJob(data);
      if (data.status === 'pending' || data.status === 'running') {
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [jobId]);

  if (!job) {
    return <main className="mx-auto max-w-3xl px-6 py-12">Chargement…</main>;
  }

  if (job.status === 'pending' || job.status === 'running') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-md border border-gray-200 p-6">
          <h2 className="font-semibold">Traitement en cours…</h2>
          <p className="mt-2 text-sm text-gray-600">
            Cela peut prendre quelques minutes. Tu peux fermer cet onglet et revenir, le résultat sera là.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Résultat</h1>
      {job.result && <AutoResultRenderer result={job.result} />}
    </main>
  );
}
