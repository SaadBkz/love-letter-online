import { Redis } from '@upstash/redis';

/**
 * Client Upstash Redis côté serveur uniquement.
 * Requiert UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN dans l'env.
 */
let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      'Upstash Redis non configuré. Set UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN.',
    );
  }
  client = new Redis({ url, token });
  return client;
}

/** Vérifie si le store Upstash est configuré (utilisé pour activer/désactiver le multi). */
export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
