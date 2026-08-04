type CacheEntry<T> = { data: T; expiresAt: number };
const docCache = new Map<string, CacheEntry<unknown>>();
const queryCache = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export async function cachedGetDoc<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T | null>
): Promise<T | null> {
  const now = Date.now();
  const entry = docCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  if (pending.has(key)) {
    return pending.get(key) as Promise<T | null>;
  }

  const promise = fetcher().then((data) => {
    pending.delete(key);
    if (data !== null && data !== undefined) {
      docCache.set(key, { data, expiresAt: now + ttlMs });
    }
    return data;
  }).catch((err) => {
    pending.delete(key);
    throw err;
  });

  pending.set(key, promise);
  return promise;
}

export async function cachedQuery<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = queryCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  if (pending.has(key)) {
    return pending.get(key) as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    pending.delete(key);
    queryCache.set(key, { data, expiresAt: now + ttlMs });
    return data;
  }).catch((err) => {
    pending.delete(key);
    throw err;
  });

  pending.set(key, promise);
  return promise;
}

export function invalidateDocCache(key: string): void {
  docCache.delete(key);
}

export function invalidateQueryCache(key: string): void {
  queryCache.delete(key);
}

export function clearDocCache(): void {
  docCache.clear();
  queryCache.clear();
  pending.clear();
}
