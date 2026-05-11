/**
 * lib/rateLimit.ts
 *
 * Rate limiter sliding-window basique.
 * - In-memory (single instance) : OK pour <1k requêtes/min/instance.
 * - Pour multi-instance (Vercel multi-region) : upgrade vers Upstash Redis.
 *
 * Référence : awesome-scalability — token bucket et sliding window.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * @param key   Identifiant logique : `${routeName}:${userId|ip}`
 * @param limit Nombre max de hits dans la window
 * @param windowMs Window en ms (default 60s)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/** Utilitaire : extrait l'IP fiable (Vercel headers) ou fallback */
export function getClientId(req: Request, userId?: string): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

/** Cleanup périodique pour ne pas leak les buckets expirés */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }, 60_000).unref?.();
}
