'use client';

import { useState } from 'react';
import productConfig from '@/config/product.config';

export default function Billing() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error || 'Erreur Stripe');
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error === 'no_subscription' ? 'Aucun abonnement actif' : (error || 'Erreur'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <button onClick={handlePortal} disabled={!!loading}
          className="text-sm underline disabled:opacity-50">
          Gérer mon abonnement →
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {productConfig.pricing.plans.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="mt-2 text-2xl font-bold">{p.price}</p>
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {p.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            {p.stripePriceId ? (
              <button
                onClick={() => handleCheckout(p.stripePriceId!)}
                disabled={!!loading}
                className="mt-6 block w-full rounded-md bg-black py-2 text-center text-sm font-medium text-white disabled:opacity-50"
              >
                {loading === p.stripePriceId ? 'Redirection…' : p.cta}
              </button>
            ) : (
              <p className="mt-6 text-center text-xs text-gray-500">Plan actuel</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
