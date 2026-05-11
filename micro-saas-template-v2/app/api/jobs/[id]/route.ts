import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getJob } from '@/lib/jobs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const job = await getJob(id, user.id);
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(job);
}
