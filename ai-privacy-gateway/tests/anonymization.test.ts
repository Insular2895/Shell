import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/detect-pii.js', () => ({
  detectPii: vi.fn(async () => [
    { entity_type: 'PERSON', start: 6, end: 17, score: 0.99 },
    { entity_type: 'EMAIL_ADDRESS', start: 25, end: 41, score: 0.99 },
  ]),
}));

describe('anonymize/deanonymize roundtrip', () => {
  it('preserves text content modulo PII', async () => {
    const { anonymize, deanonymize } = await import('../src/anonymize.js');
    const input = 'Hello Jean Dupont, email jean@example.com';
    const result = await anonymize(input);
    expect(result.anonymized_text).not.toContain('Jean Dupont');
    expect(result.anonymized_text).not.toContain('jean@example.com');
    await expect(deanonymize(result.anonymized_text, result.mapping_id)).resolves.toBe(input);
  });
});
