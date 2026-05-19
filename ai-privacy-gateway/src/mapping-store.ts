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
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';

const MAPPING_TTL_SECONDS = parseInt(process.env.MAPPING_TTL_SECONDS || '86400', 10);
const REDIS_KEY_PREFIX = process.env.MAPPING_REDIS_PREFIX || 'ai-privacy:mapping:';

const memoryStore = new Map<string, { mapping: Map<string, string>; expiresAt: number }>();
let redisClientPromise: Promise<import('ioredis').default | null> | null = null;

export async function saveMapping(mapping: Map<string, string>): Promise<string> {
  const id = randomUUID();
  const redis = await getRedis();
  if (redis) {
    await redis.setex(
      `${REDIS_KEY_PREFIX}${id}`,
      MAPPING_TTL_SECONDS,
      encrypt(JSON.stringify([...mapping.entries()])),
    );
    return id;
  }

  assertMemoryStoreAllowed();
  memoryStore.set(id, {
    mapping,
    expiresAt: Date.now() + MAPPING_TTL_SECONDS * 1000,
  });
  return id;
}

export async function loadMapping(id: string): Promise<Map<string, string>> {
  const redis = await getRedis();
  if (redis) {
    const encrypted = await redis.get(`${REDIS_KEY_PREFIX}${id}`);
    if (!encrypted) throw new Error('mapping_not_found_or_expired');
    return new Map(JSON.parse(decrypt(encrypted)) as Array<[string, string]>);
  }

  assertMemoryStoreAllowed();
  const entry = memoryStore.get(id);
  if (!entry) throw new Error('mapping_not_found_or_expired');
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(id);
    throw new Error('mapping_expired');
  }
  return entry.mapping;
}

async function getRedis() {
  if (redisClientPromise) return redisClientPromise;
  redisClientPromise = (async () => {
    if (!process.env.REDIS_URL) return null;
    const Redis = (await import('ioredis')).default.default;
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      tls: process.env.REDIS_TLS === '1' ? {} : undefined,
    });
  })();
  return redisClientPromise;
}

function assertMemoryStoreAllowed() {
  if (process.env.NODE_ENV === 'production' && process.env.AI_GATEWAY_ALLOW_MEMORY_STORE !== '1') {
    throw new Error('redis_mapping_store_required_in_production');
  }
}

function encryptionKey() {
  const secret = process.env.AI_MAPPING_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AI_MAPPING_ENCRYPTION_KEY_required');
    }
    return createHash('sha256').update('dev-only-ai-privacy-key').digest();
  }
  return createHash('sha256').update(secret).digest();
}

function encrypt(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  });
}

function decrypt(payload: string) {
  const parsed = JSON.parse(payload) as { iv: string; tag: string; data: string };
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(parsed.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
