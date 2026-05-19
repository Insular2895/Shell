/**
 * /api/upload
 *
 * 2 modes selon l'auth :
 *   - User upload  (cookie session) : pour les fichiers que l'user envoie
 *                                     avant de lancer un job (CV, image…).
 *                                     Stocké dans `job-uploads/<user_id>/...`
 *                                     Retourne un signed URL court (1h).
 *
 *   - Engine callback (Bearer token) : l'engine renvoie un fichier généré
 *                                      pendant un run. Stocké dans
 *                                      `job-outputs/<job_id>/...`
 *                                      Retourne un signed URL long (7 jours).
 *
 * Cette route est exclue du middleware d'auth (le service-token est validé ici).
 */
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import {
  uploadUserFile,
  uploadEngineFile,
  getSignedUploadsUrl,
  getSignedOutputsUrl,
} from '@/lib/storage';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
// Augmente la limite max body pour les uploads (Next.js default = 1mb)
export const maxDuration = 60;

const DEFAULT_ALLOWED_MIME = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
];
const MAX_USER_UPLOAD_BYTES = Number(process.env.MAX_USER_UPLOAD_BYTES ?? 10 * 1024 * 1024);
const MAX_ENGINE_UPLOAD_BYTES = Number(process.env.MAX_ENGINE_UPLOAD_BYTES ?? 25 * 1024 * 1024);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';

  // ----- Mode engine callback -----
  if (auth.startsWith('Bearer ') && auth.slice(7) === process.env.SHELL_SERVICE_TOKEN) {
    return handleEngineUpload(req);
  }

  // ----- Mode user upload -----
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return handleUserUpload(req, user.id);
}

async function handleUserUpload(req: Request, userId: string) {
  const rl = rateLimit(`upload:user:${userId}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAt: rl.resetAt },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  const validation = validateUploadFile(file, MAX_USER_UPLOAD_BYTES);
  if (validation) return validation;

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadUserFile(userId, file.name, buffer, file.type);
  const url = await getSignedUploadsUrl(path, 60 * 60); // 1h
  return NextResponse.json({ url, path });
}

async function handleEngineUpload(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const jobId = form.get('job_id') as string | null;
  if (!file || !jobId) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: 'invalid_job_id' }, { status: 400 });
  }
  const validation = validateUploadFile(file, MAX_ENGINE_UPLOAD_BYTES);
  if (validation) return validation;

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadEngineFile(jobId, file.name, buffer, file.type);
  const url = await getSignedOutputsUrl(path, 60 * 60 * 24 * 7); // 7 jours
  return NextResponse.json({ url, path });
}

function validateUploadFile(file: File, maxBytes: number) {
  if (file.size <= 0) {
    return NextResponse.json({ error: 'empty_file' }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: 'file_too_large', maxBytes },
      { status: 413 },
    );
  }

  const allowed = new Set(
    (process.env.ALLOWED_UPLOAD_MIME_TYPES ?? DEFAULT_ALLOWED_MIME.join(','))
      .split(',')
      .map((mime) => mime.trim().toLowerCase())
      .filter(Boolean),
  );
  const mime = (file.type || 'application/octet-stream').toLowerCase();
  if (!allowed.has(mime)) {
    return NextResponse.json(
      { error: 'unsupported_media_type', allowed: [...allowed] },
      { status: 415 },
    );
  }

  return null;
}
