/**
 * anonymize.ts
 * Pseudonymisation réversible : remplace chaque PII par <TYPE_N>, garde un mapping local.
 * Le mapping NE quitte JAMAIS notre infra.
 */
import { detectPii } from './detect-pii.js';
import { saveMapping, loadMapping } from './mapping-store.js';

export type AnonymizeResult = {
  anonymized_text: string;
  mapping_id: string;
};

export async function anonymize(text: string, language = 'fr'): Promise<AnonymizeResult> {
  const pii = await detectPii(text, language);
  pii.sort((a, b) => b.start - a.start);

  const mapping = new Map<string, string>();  // pseudonym → original
  const counters: Record<string, number> = {};

  let anonymized = text;
  for (const p of pii) {
    const original = text.slice(p.start, p.end);
    counters[p.entity_type] = (counters[p.entity_type] ?? 0) + 1;
    const pseudonym = `<${p.entity_type}_${counters[p.entity_type]}>`;
    if (!mapping.has(pseudonym)) mapping.set(pseudonym, original);
    anonymized = anonymized.slice(0, p.start) + pseudonym + anonymized.slice(p.end);
  }

  const mapping_id = await saveMapping(mapping);
  return { anonymized_text: anonymized, mapping_id };
}

export async function deanonymize(text: string, mappingId: string): Promise<string> {
  const mapping = await loadMapping(mappingId);
  let result = text;
  for (const [pseudonym, original] of mapping) {
    result = result.replaceAll(pseudonym, original);
  }
  return result;
}
