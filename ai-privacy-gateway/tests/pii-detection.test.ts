/**
 * pii-detection.test.ts
 * Tests unitaires : detect-pii doit identifier les PII clés en français.
 *
 * NOTE : ces tests nécessitent Presidio analyzer up sur localhost:5001.
 * Skipped si pas dispo.
 */
import { describe, it, expect } from 'vitest';
import { detectPii } from '../src/detect-pii.js';

describe.skip('detectPii (requires Presidio running)', () => {
  it('detects French phone numbers', async () => {
    const result = await detectPii('Mon téléphone est le +33 6 12 34 56 78');
    expect(result.some((p) => p.entity_type.includes('PHONE'))).toBe(true);
  });

  it('detects emails', async () => {
    const result = await detectPii('Contact : test@example.com');
    expect(result.some((p) => p.entity_type === 'EMAIL_ADDRESS')).toBe(true);
  });

  it('detects person names (NER)', async () => {
    const result = await detectPii('Jean Dupont a appelé hier.');
    expect(result.some((p) => p.entity_type === 'PERSON')).toBe(true);
  });
});
