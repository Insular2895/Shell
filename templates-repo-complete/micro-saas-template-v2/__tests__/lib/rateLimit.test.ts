/**
 * Tests pour le rate limiter sliding window.
 */

import { describe, it, expect } from 'vitest';
import { rateLimit, getClientId } from '@/lib/rateLimit';

describe('rateLimit', () => {
  it("autorise les premières requêtes jusqu'à la limite", () => {
    const key = `test-allow-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(key, 5, 60_000);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(4 - i);
    }
  });

  it('refuse au-dessus de la limite', () => {
    const key = `test-deny-${Date.now()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000);
    const denied = rateLimit(key, 3, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.resetAt).toBeGreaterThan(Date.now());
  });

  it('isolent les keys (un user ne consomme pas le quota d\'un autre)', () => {
    const k1 = `test-iso-1-${Date.now()}`;
    const k2 = `test-iso-2-${Date.now()}`;
    for (let i = 0; i < 2; i++) rateLimit(k1, 2, 60_000);
    expect(rateLimit(k1, 2, 60_000).allowed).toBe(false);
    // k2 a son propre bucket
    expect(rateLimit(k2, 2, 60_000).allowed).toBe(true);
  });
});

describe('getClientId', () => {
  it("préfère userId quand fourni", () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(getClientId(req, 'user-abc')).toBe('u:user-abc');
  });

  it("retombe sur l'IP quand pas de userId", () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientId(req)).toBe('ip:1.2.3.4');
  });

  it('retombe sur "unknown" sans header ni userId', () => {
    const req = new Request('http://x');
    expect(getClientId(req)).toBe('ip:unknown');
  });
});
