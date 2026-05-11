/**
 * prompt-sanitizer.ts
 * Wrapper haut niveau : prend un objet { prompt, mode? } et retourne ce qui doit
 * être envoyé au LLM (jamais de PII brute).
 */
import { redact } from './redact.js';
import { anonymize, deanonymize } from './anonymize.js';

export type SanitizedPrompt = {
  prompt_for_llm: string;
  mapping_id?: string;       // si pseudonymize, pour de-anon de la réponse
  mode: 'redact' | 'pseudonymize' | 'pass-through';
  pii_count: number;
};

export async function sanitizePrompt(
  text: string,
  mode: 'redact' | 'pseudonymize' = 'redact',
  language = 'fr',
): Promise<SanitizedPrompt> {
  if (mode === 'redact') {
    const result = await redact(text, language);
    const total = Object.values(result.redactions_count).reduce((a, b) => a + b, 0);
    return {
      prompt_for_llm: result.redacted_text,
      mode,
      pii_count: total,
    };
  }
  const result = await anonymize(text, language);
  // We can't easily count from anonymize — just flag presence
  return {
    prompt_for_llm: result.anonymized_text,
    mapping_id: result.mapping_id,
    mode,
    pii_count: result.anonymized_text.match(/<[A-Z_]+_\d+>/g)?.length ?? 0,
  };
}

export async function processLlmResponse(response: string, mappingId?: string): Promise<string> {
  if (!mappingId) return response;
  return await deanonymize(response, mappingId);
}
