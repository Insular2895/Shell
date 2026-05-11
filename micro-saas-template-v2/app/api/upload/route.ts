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

export const dynamic = 'force-dynamic';
// Augmente la limite max body pour les uploads (Next.js default = 1mb)
export const maxDuration = 60;

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
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadEngineFile(jobId, file.name, buffer, file.type);
  const url = await getSignedOutputsUrl(path, 60 * 60 * 24 * 7); // 7 jours
  return NextResponse.json({ url, path });
}
