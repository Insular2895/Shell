/**
 * prompt-leak.test.ts
 * Test E2E critique : un prompt contenant PII ne DOIT JAMAIS atteindre le LLM en clair.
 */
import { describe, it, expect, vi } from 'vitest';
import { sanitizePrompt } from '../src/prompt-sanitizer.js';

describe.skip('prompt-leak (requires Presidio running)', () => {
  it('redacts email + phone before LLM call', async () => {
    const input = 'Hello, my name is Jean Dupont, email jean@example.com phone +33612345678';
    const result = await sanitizePrompt(input, 'redact');

    expect(result.prompt_for_llm).not.toContain('jean@example.com');
    expect(result.prompt_for_llm).not.toContain('+33612345678');
    expect(result.prompt_for_llm).not.toContain('Jean Dupont');
    expect(result.pii_count).toBeGreaterThan(0);
  });

  it('pseudonymize returns mapping_id reusable for de-anon', async () => {
    const input = 'Hello Jean Dupont';
    const r = await sanitizePrompt(input, 'pseudonymize');
    expect(r.mapping_id).toBeDefined();
    expect(r.prompt_for_llm).toContain('<PERSON_');
  });
});
