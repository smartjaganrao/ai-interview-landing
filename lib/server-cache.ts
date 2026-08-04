type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

export async function getServerCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }
  cache.delete(key);
  const promise = fetcher().then((data) => {
    cache.set(key, { data, expiresAt: now + ttlMs });
    return data;
  }).catch((err) => {
    throw err;
  });
  return promise;
}

export function invalidateServerCache(key: string): void {
  cache.delete(key);
}

export function clearServerCache(): void {
  cache.clear();
}
