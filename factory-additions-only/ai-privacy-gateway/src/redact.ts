/**
 * redact.ts
 * Remplace toutes les PII détectées par [REDACTED_<TYPE>].
 * Action irréversible (pas de mapping). Usage : logs, prompts non personnalisés.
 */
import { detectPii, type DetectedPii } from './detect-pii.js';

export type RedactionResult = {
  redacted_text: string;
  redactions_count: Record<string, number>;
};

export async function redact(text: string, language = 'fr'): Promise<RedactionResult> {
  const pii = await detectPii(text, language);

  // Sort by start position descending — replace from end so positions stay valid
  pii.sort((a, b) => b.start - a.start);

  let redacted = text;
  const counts: Record<string, number> = {};

  for (const p of pii) {
    redacted = redacted.slice(0, p.start) + `[REDACTED_${p.entity_type}]` + redacted.slice(p.end);
    counts[p.entity_type] = (counts[p.entity_type] ?? 0) + 1;
  }

  return { redacted_text: redacted, redactions_count: counts };
}
