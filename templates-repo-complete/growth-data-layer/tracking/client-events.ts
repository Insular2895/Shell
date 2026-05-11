/**
 * growth-data-layer/tracking/client-events.ts
 * Wrapper côté browser — respecte le consent.
 */
import { hasConsent } from './consent-check';

type EventName = 'page_view' | 'cta_clicked' | 'form_submitted' | 'signup_started' | 'signup_completed';

export async function track(event: EventName, properties: Record<string, unknown> = {}): Promise<void> {
  if (!hasConsent('analytics')) return;
  const safe = stripPII(properties);
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties: safe, occurred_at: new Date().toISOString() }),
      keepalive: true,
    });
  } catch {
    // analytics ne doit jamais casser l'app
  }
}

function stripPII(props: Record<string, unknown>): Record<string, unknown> {
  const stripped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (/email|phone|password|token|secret/i.test(k)) continue;
    stripped[k] = v;
  }
  return stripped;
}
