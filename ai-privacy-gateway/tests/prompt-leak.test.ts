/**
 * prompt-leak.test.ts
 * Test E2E critique : un prompt contenant PII ne DOIT JAMAIS atteindre le LLM en clair.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/detect-pii.js', () => ({
  detectPii: vi.fn(async (text: string) => {
    const findings = [];
    const person = text.indexOf('Jean Dupont');
    if (person >= 0) findings.push({ entity_type: 'PERSON', start: person, end: person + 11, score: 0.99 });
    const email = text.indexOf('jean@example.com');
    if (email >= 0) findings.push({ entity_type: 'EMAIL_ADDRESS', start: email, end: email + 16, score: 0.99 });
    const phone = text.indexOf('+33612345678');
    if (phone >= 0) findings.push({ entity_type: 'PHONE_NUMBER', start: phone, end: phone + 12, score: 0.99 });
    return findings;
  }),
}));

describe('prompt-leak', () => {
  it('redacts email + phone before LLM call', async () => {
    const { sanitizePrompt } = await import('../src/prompt-sanitizer.js');
    const input = 'Hello, my name is Jean Dupont, email jean@example.com phone +33612345678';
    const result = await sanitizePrompt(input, 'redact');

    expect(result.prompt_for_llm).not.toContain('jean@example.com');
    expect(result.prompt_for_llm).not.toContain('+33612345678');
    expect(result.prompt_for_llm).not.toContain('Jean Dupont');
    expect(result.pii_count).toBeGreaterThan(0);
  });

  it('pseudonymize returns mapping_id reusable for de-anon', async () => {
    const { sanitizePrompt } = await import('../src/prompt-sanitizer.js');
    const input = 'Hello Jean Dupont';
    const r = await sanitizePrompt(input, 'pseudonymize');
    expect(r.mapping_id).toBeDefined();
    expect(r.prompt_for_llm).toContain('<PERSON_');
  });
});
