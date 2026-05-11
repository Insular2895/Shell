/**
 * GET /api/decisions?status=pending
 * Liste les décisions à valider (queue cf decision_queue table).
 *
 * POST /api/decisions/:id/resolve
 * Approuve/rejette une décision.
 */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'pending';
  // TODO phase 4
  return NextResponse.json({ stub: true, status, decisions: [] });
}
