/**
 * mapping-store.ts
 * Storage local chiffré pour les mappings pseudonyme→original.
 * Backend : Redis avec TTL 24h par défaut.
 *
 * SECURITY :
 *   - Le mapping NE QUITTE JAMAIS notre infra
 *   - Chiffré au repos (Redis avec TLS local + clé d'app)
 *   - TTL court : 24h max
 */
import { randomUUID } from 'node:crypto';

const MAPPING_TTL_SECONDS = parseInt(process.env.MAPPING_TTL_SECONDS || '86400', 10);

// Phase 1 stub : in-memory (à remplacer par Redis chiffré)
const memoryStore = new Map<string, { mapping: Map<string, string>; expiresAt: number }>();

export async function saveMapping(mapping: Map<string, string>): Promise<string> {
  const id = randomUUID();
  memoryStore.set(id, {
    mapping,
    expiresAt: Date.now() + MAPPING_TTL_SECONDS * 1000,
  });
  // TODO phase 1 : remplacer par Redis SET avec TTL
  return id;
}

export async function loadMapping(id: string): Promise<Map<string, string>> {
  const entry = memoryStore.get(id);
  if (!entry) throw new Error('mapping_not_found_or_expired');
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(id);
    throw new Error('mapping_expired');
  }
  return entry.mapping;
}
