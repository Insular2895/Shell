'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AutoRunForm from '@/components/run/AutoRunForm';

export default function RunPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: values }),
      });
      if (res.status === 402) {
        router.push('/billing?reason=quota');
        return;
      }
      const { jobId } = await res.json();
      router.push(`/results/${jobId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <AutoRunForm onSubmit={handleSubmit} isSubmitting={submitting} />
    </main>
  );
}
