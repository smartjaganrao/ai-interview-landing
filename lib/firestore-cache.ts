type CacheEntry<T> = { data: T; expiresAt: number };
const docCache = new Map<string, CacheEntry<unknown>>();
const queryCache = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

const LS_PREFIX = 'fc_cache:';

function readLocalStorageEntry<T>(key: string, opts?: { ignoreExpiry?: boolean }): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!opts?.ignoreExpiry && entry.expiresAt <= Date.now()) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeLocalStorageEntry<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota / private mode — ignore
  }
}

function removeLocalStorageEntry(key: string): void {
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    // ignore
  }
}

export async function cachedGetDoc<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T | null>,
  isValid?: (data: T) => boolean
): Promise<T | null> {
  const now = Date.now();
  const entry = docCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  const persisted = readLocalStorageEntry<T>(key);
  if (persisted) {
    docCache.set(key, persisted);
    return persisted.data;
  }

  if (pending.has(key)) {
    return pending.get(key) as Promise<T | null>;
  }

  const promise = fetcher().then((data) => {
    pending.delete(key);
    if (data !== null && data !== undefined) {
      if (isValid && !isValid(data)) {
        // The fetch "succeeded" but the response itself looks broken/
        // degraded (e.g. an API-level failure fallback) — keep serving the
        // last known-good value, even if expired, instead of overwriting
        // it with a bad one. Only if there's never been a good value do we
        // fall through to the degraded data (caller must handle that case).
        const stale = entry ?? readLocalStorageEntry<T>(key, { ignoreExpiry: true });
        if (stale) return stale.data;
        return data;
      }
      const cacheEntry = { data, expiresAt: now + ttlMs };
      docCache.set(key, cacheEntry);
      writeLocalStorageEntry(key, cacheEntry);
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

  const persisted = readLocalStorageEntry<T>(key);
  if (persisted) {
    queryCache.set(key, persisted);
    return persisted.data;
  }

  if (pending.has(key)) {
    return pending.get(key) as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    pending.delete(key);
    const cacheEntry = { data, expiresAt: now + ttlMs };
    queryCache.set(key, cacheEntry);
    writeLocalStorageEntry(key, cacheEntry);
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
  removeLocalStorageEntry(key);
}

export function invalidateQueryCache(key: string): void {
  queryCache.delete(key);
  removeLocalStorageEntry(key);
}

export function clearDocCache(): void {
  docCache.clear();
  queryCache.clear();
  pending.clear();
}
