/**
 * pii-policy.ts
 * Charge `policies/ai-data-policy.yml` et expose une API typée.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

export type PiiAction = 'redact' | 'pseudonymize' | 'hash' | 'keep' | 'redact_partial';

export type PiiFieldRule = {
  detection: string;
  default_action: PiiAction;
  pseudonym_prefix?: string;
  reversible: boolean;
};

let cachedPolicy: Record<string, PiiFieldRule> | null = null;

export async function loadPolicy(): Promise<Record<string, PiiFieldRule>> {
  if (cachedPolicy) return cachedPolicy;
  const policyPath = path.resolve('ai-privacy-gateway/policies/ai-data-policy.yml');
  const raw = await fs.readFile(policyPath, 'utf-8');
  const parsed = yaml.parse(raw);
  cachedPolicy = parsed.pii_fields as Record<string, PiiFieldRule>;
  return cachedPolicy;
}

export async function getActionForType(entityType: string): Promise<PiiAction> {
  const policy = await loadPolicy();
  const rule = policy[entityType.toLowerCase()];
  return rule?.default_action ?? 'redact';  // fail-safe : redact si inconnu
}
