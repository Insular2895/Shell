/**
 * lib/storage.ts
 *
 * Storage helpers Supabase.
 * On distingue 2 buckets :
 *   - `job-uploads`  : ce que l'user envoie (CV, image…) — accès via signed URL
 *   - `job-outputs`  : ce que l'engine génère (rapport PDF, DOCX…) — accès via signed URL
 *
 * Les uploads engine→Storage utilisent le service-role client (bypass RLS)
 * car l'engine est un système, pas un user.
 */

import { createServerClient, createServiceRoleClient } from './supabase/server';

const UPLOADS_BUCKET = 'job-uploads';
const OUTPUTS_BUCKET = 'job-outputs';

export function sanitizeStorageFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() || 'file';
  const normalized = base
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return normalized || 'file';
}

// ----- USER UPLOADS (en amont du run) -----
export async function uploadUserFile(userId: string, filename: string, file: Blob | Buffer, mime = 'application/octet-stream') {
  const supabase = await createServerClient();
  const path = `${userId}/${crypto.randomUUID()}-${sanitizeStorageFilename(filename)}`;
  const { error } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .upload(path, file, { contentType: mime, upsert: false });
  if (error) throw error;
  return path;
}

// ----- ENGINE OUTPUTS (via service-role car engine == système) -----
export function uploadEngineFile(jobId: string, filename: string, file: Buffer, mime = 'application/octet-stream') {
  const supabase = createServiceRoleClient();
  const path = `${jobId}/${crypto.randomUUID()}-${sanitizeStorageFilename(filename)}`;
  return supabase.storage
    .from(OUTPUTS_BUCKET)
    .upload(path, file, { contentType: mime, upsert: true })
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) throw error;
      return path;
    });
}

// ----- SIGNED URLS -----
export async function getSignedUploadsUrl(path: string, expiresInSeconds = 3600) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage.from(UPLOADS_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function getSignedOutputsUrl(path: string, expiresInSeconds = 60 * 60 * 24 * 7) {
  // Service-role car les engines callbacks et les pages publiques de résultat
  // peuvent avoir besoin d'un signed URL sans contexte user.
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from(OUTPUTS_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
