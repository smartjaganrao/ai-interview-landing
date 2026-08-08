/**
 * Dev-only Firestore client metrics for the landing/dashboard app.
 * Enable: localStorage.setItem('javihai_fs_metrics','1')
 */

interface Counters {
  reads: number;
  writes: number;
  cacheHits: number;
  cacheMisses: number;
  byCollection: Record<string, number>;
  byFeature: Record<string, number>;
}

const counters: Counters = {
  reads: 0,
  writes: 0,
  cacheHits: 0,
  cacheMisses: 0,
  byCollection: {},
  byFeature: {},
};

function enabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('javihai_fs_metrics') === '1' || process.env.NODE_ENV === 'development';
  } catch {
    return process.env.NODE_ENV === 'development';
  }
}

function bump(map: Record<string, number>, key: string, n = 1) {
  map[key] = (map[key] || 0) + n;
}

export function trackFsRead(collection: string, feature: string, docs = 1): void {
  if (!enabled()) return;
  counters.reads += docs;
  bump(counters.byCollection, collection, docs);
  bump(counters.byFeature, feature, docs);
}

export function trackFsWrite(collection: string, feature: string, docs = 1): void {
  if (!enabled()) return;
  counters.writes += docs;
  bump(counters.byCollection, collection, docs);
  bump(counters.byFeature, feature, docs);
}

export function trackCacheHit(feature: string): void {
  if (!enabled()) return;
  counters.cacheHits += 1;
  bump(counters.byFeature, `${feature}:hit`, 1);
}

export function trackCacheMiss(feature: string): void {
  if (!enabled()) return;
  counters.cacheMisses += 1;
  bump(counters.byFeature, `${feature}:miss`, 1);
}

export function getFsMetrics() {
  const total = counters.cacheHits + counters.cacheMisses;
  return {
    ...counters,
    byCollection: { ...counters.byCollection },
    byFeature: { ...counters.byFeature },
    cacheHitRate: total === 0 ? 0 : counters.cacheHits / total,
  };
}

export function resetFsMetrics(): void {
  counters.reads = 0;
  counters.writes = 0;
  counters.cacheHits = 0;
  counters.cacheMisses = 0;
  counters.byCollection = {};
  counters.byFeature = {};
}

if (typeof window !== 'undefined') {
  (window as unknown as { __javihaiFsMetrics?: unknown }).__javihaiFsMetrics = {
    get: getFsMetrics,
    reset: resetFsMetrics,
  };
}
