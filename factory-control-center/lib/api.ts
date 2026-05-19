import { NextResponse } from 'next/server';

export function dbError(scope: string, error: { code?: string; message?: string }) {
  console.error(`[factory-control-center:${scope}] ${error.code ?? 'db_error'}`);
  return NextResponse.json({ error: 'db_error' }, { status: 500 });
}
