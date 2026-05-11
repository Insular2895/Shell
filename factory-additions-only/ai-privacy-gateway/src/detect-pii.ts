/**
 * detect-pii.ts
 * Wrapper Presidio Analyzer.
 * Phase 1 implementation : tape direct sur le HTTP local Presidio (cf docker-compose.yml).
 */
export type DetectedPii = {
  entity_type: string;
  start: number;
  end: number;
  score: number;
  text?: string;  // pour debug local — JAMAIS log en prod
};

const PRESIDIO_URL = process.env.PRESIDIO_ANALYZER_URL || 'http://127.0.0.1:5001';

export async function detectPii(text: string, language = 'fr'): Promise<DetectedPii[]> {
  const res = await fetch(`${PRESIDIO_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language,
      score_threshold: 0.5,
    }),
  });
  if (!res.ok) {
    throw new Error(`Presidio analyzer error: ${res.status}`);
  }
  return res.json() as Promise<DetectedPii[]>;
}
