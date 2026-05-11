/**
 * lib/circuitBreaker.ts
 *
 * Circuit breaker (Closed → Open → Half-Open).
 * Pour les calls HTTP vers l'engine distant : si trop d'échecs, on arrête de
 * tenter pendant `cooldownMs`, puis on laisse passer 1 essai (half-open) et
 * on rebascule selon le résultat.
 *
 * Référence : Michael Nygard "Release It!", system-design-101.
 */

type State = 'closed' | 'open' | 'half-open';

type Breaker = {
  state: State;
  failures: number;
  openedAt: number;
};

const breakers = new Map<string, Breaker>();

const DEFAULTS = {
  failureThreshold: 5, // 5 échecs consécutifs → open
  cooldownMs: 30_000,   // 30s avant tentative half-open
};

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly key: string, public readonly resetAt: number) {
    super(`Circuit breaker OPEN for ${key}, retry after ${new Date(resetAt).toISOString()}`);
  }
}

export async function withBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  opts: Partial<typeof DEFAULTS> = {},
): Promise<T> {
  const cfg = { ...DEFAULTS, ...opts };
  const b = breakers.get(key) ?? { state: 'closed' as State, failures: 0, openedAt: 0 };

  // Si OPEN et cooldown pas écoulé → fail fast
  if (b.state === 'open') {
    const elapsed = Date.now() - b.openedAt;
    if (elapsed < cfg.cooldownMs) {
      throw new CircuitBreakerOpenError(key, b.openedAt + cfg.cooldownMs);
    }
    b.state = 'half-open';
  }

  try {
    const result = await fn();
    // Succès → reset
    b.state = 'closed';
    b.failures = 0;
    breakers.set(key, b);
    return result;
  } catch (err) {
    b.failures += 1;
    if (b.failures >= cfg.failureThreshold || b.state === 'half-open') {
      b.state = 'open';
      b.openedAt = Date.now();
    }
    breakers.set(key, b);
    throw err;
  }
}

/** Backoff exponentiel avec jitter (anti-thundering-herd) */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseMs?: number; maxMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 3, baseMs = 1000, maxMs = 30_000 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts - 1) break;
      const delay = Math.min(maxMs, baseMs * Math.pow(2, attempt));
      const jitter = Math.random() * delay * 0.3; // ±30%
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
  throw lastErr;
}
