/**
 * Tiny in-memory LRU for router classifier results. Lives at module scope so
 * it survives across requests in the same Node worker; never grows past
 * `MAX_ENTRIES`. Keys are hashes of `(message, attachmentCount)` — different
 * users can therefore hit the same cached classification for identical
 * prompts, which is the desired behaviour.
 */

import { createHash } from 'node:crypto';

const MAX_ENTRIES = 500;
/** TTL keeps the cache from holding stale rationales after deploys. */
const TTL_MS = 60 * 60 * 1000;

type Entry<V> = {
  value: V;
  expiresAt: number;
};

const store = new Map<string, Entry<unknown>>();

export function makeRouterCacheKey(input: {
  message: string;
  attachmentCount: number;
}): string {
  const normalized = input.message.trim().toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha1')
    .update(`${input.attachmentCount}|${normalized}`)
    .digest('hex');
}

export function getRouterCache<V>(key: string): V | undefined {
  const entry = store.get(key) as Entry<V> | undefined;
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  // LRU touch: re-insert to move to the end.
  store.delete(key);
  store.set(key, entry);
  return entry.value;
}

export function setRouterCache<V>(key: string, value: V): void {
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
    }
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

/** Test-only: drop everything. */
export function _resetRouterCacheForTests(): void {
  store.clear();
}
