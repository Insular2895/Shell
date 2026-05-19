/**
 * factory-control-center root page : overview multi-sites.
 *
 * Phase 4 implementation. Currently a placeholder reading from /api/sites.
 */
export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';

async function getSites() {
  const headerStore = await headers();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/sites`, {
    cache: 'no-store',
    headers: { cookie: headerStore.get('cookie') ?? '' },
  });
  if (!res.ok) return { sites: [], error: `api_sites_${res.status}` };
  return res.json();
}

export default async function CockpitOverview() {
  const data = await getSites();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Factory Control Center</h1>
      <p className="text-sm text-gray-600 mb-6">Cockpit multi-sites (phase 4 — UI à finaliser)</p>
      <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
