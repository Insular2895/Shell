import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'open';
  // TODO phase 4: SELECT * FROM incidents WHERE status = $1 ORDER BY detected_at DESC
  return NextResponse.json({ stub: true, status, incidents: [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: insert + classify
  return NextResponse.json({ stub: true, created: body }, { status: 201 });
}
