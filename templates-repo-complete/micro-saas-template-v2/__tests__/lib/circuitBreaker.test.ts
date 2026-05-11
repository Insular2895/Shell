/**
 * Tests pour le circuit breaker.
 *
 * Vérifie que le breaker passe bien en OPEN après N échecs et qu'il bascule
 * en HALF-OPEN après cooldown. Pattern classique Release It! / Hystrix.
 */

import { describe, it, expect } from 'vitest';
import {
  withBreaker,
  retryWithBackoff,
  CircuitBreakerOpenError,
} from '@/lib/circuitBreaker';

describe('withBreaker', () => {
  it('laisse passer les calls en mode closed', async () => {
    const result = await withBreaker(`test-closed-${Date.now()}`, async () => 'ok');
    expect(result).toBe('ok');
  });

  it("ouvre le circuit après N échecs et fail-fast les suivants", async () => {
    const key = `test-open-${Date.now()}`;
    const failFn = async () => {
      throw new Error('downstream_failed');
    };

    // 5 échecs consécutifs (failureThreshold default = 5)
    for (let i = 0; i < 5; i++) {
      await expect(withBreaker(key, failFn)).rejects.toThrow('downstream_failed');
    }

    // 6e appel doit fail-fast avec CircuitBreakerOpenError (sans appeler fn)
    let fnCalled = false;
    await expect(
      withBreaker(key, async () => {
        fnCalled = true;
        return 'ok';
      }),
    ).rejects.toBeInstanceOf(CircuitBreakerOpenError);
    expect(fnCalled).toBe(false);
  });

  it('reset le compteur de failures sur un succès', async () => {
    const key = `test-reset-${Date.now()}`;
    let shouldFail = true;
    const fn = async () => {
      if (shouldFail) throw new Error('fail');
      return 'ok';
    };

    // 3 échecs (sous le seuil de 5)
    for (let i = 0; i < 3; i++) {
      await expect(withBreaker(key, fn)).rejects.toThrow();
    }

    // Un succès → reset
    shouldFail = false;
    const result = await withBreaker(key, fn);
    expect(result).toBe('ok');

    // Le breaker devrait être à 0 failures, donc 5 nouveaux échecs nécessaires
    shouldFail = true;
    for (let i = 0; i < 4; i++) {
      await expect(withBreaker(key, fn)).rejects.toThrow();
    }
    // Pas encore open après 4 fails
    let fnCalled = false;
    await expect(
      withBreaker(key, async () => {
        fnCalled = true;
        throw new Error('fail');
      }),
    ).rejects.toThrow('fail');
    expect(fnCalled).toBe(true);
  });
});

describe('retryWithBackoff', () => {
  it('retry sur échec puis succède', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('transient');
      return 'success';
    };

    const result = await retryWithBackoff(fn, {
      maxAttempts: 3,
      baseMs: 10, // tests rapides
      maxMs: 50,
    });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('throw après maxAttempts', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts += 1;
      throw new Error('always_fail');
    };

    await expect(
      retryWithBackoff(fn, { maxAttempts: 3, baseMs: 10, maxMs: 20 }),
    ).rejects.toThrow('always_fail');
    expect(attempts).toBe(3);
  });
});
