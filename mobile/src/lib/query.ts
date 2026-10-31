import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { api } from '../services/api';

/**
 * Cache data sederhana (tanpa pustaka tambahan): data per "key" (path API) dibagi antarlayar.
 * - useQuery(path): ambil data, simpan di cache, render ulang saat cache berubah.
 * - invalidate(prefix): tandai data basi dan ambil ulang untuk layar yang sedang menampilkannya.
 * - mutate(path, fn): ubah data di cache secara langsung (update optimis).
 */
type Entry = { data?: unknown; error?: string; loading: boolean; stamp: number };
const cache = new Map<string, Entry>();
const subs = new Set<() => void>();
const inflight = new Map<string, Promise<void>>();
let version = 0;

const emit = () => {
  version++;
  subs.forEach((f) => f());
};

function load(key: string): Promise<void> {
  if (inflight.has(key)) return inflight.get(key)!;
  const prev = cache.get(key);
  cache.set(key, { ...prev, loading: true, stamp: prev?.stamp ?? 0 });
  emit();
  const p = api
    .get<unknown>(key)
    .then((data) => {
      cache.set(key, { data, loading: false, stamp: Date.now() });
    })
    .catch((e: Error) => {
      cache.set(key, { ...cache.get(key), error: e.message, loading: false, stamp: Date.now() });
    })
    .finally(() => {
      inflight.delete(key);
      emit();
    });
  inflight.set(key, p);
  return p;
}

const mounted = new Map<string, number>();

export function invalidate(prefix: string | RegExp) {
  for (const key of [...cache.keys()]) {
    if (typeof prefix === 'string' ? !key.startsWith(prefix) : !prefix.test(key)) continue;
    if (mounted.get(key)) load(key);
    else cache.delete(key);
  }
}

export function mutate<T>(key: string, fn: (d: T) => T) {
  const e = cache.get(key);
  if (e?.data === undefined) return;
  cache.set(key, { ...e, data: fn(e.data as T) });
  emit();
}

/** Ubah data di semua cache yang cocok dengan prefix. */
export function mutateAll<T>(prefix: string, fn: (d: T) => T) {
  for (const [key, e] of cache) if (key.startsWith(prefix) && e.data !== undefined) cache.set(key, { ...e, data: fn(e.data as T) });
  emit();
}

export function clearCache() {
  cache.clear();
  emit();
}

export function useQuery<T>(key: string | null) {
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => version,
    () => version,
  );
  useEffect(() => {
    if (!key) return;
    mounted.set(key, (mounted.get(key) || 0) + 1);
    const e = cache.get(key);
    if (!e || (!e.loading && Date.now() - e.stamp > 30_000)) load(key);
    return () => {
      mounted.set(key, (mounted.get(key) || 1) - 1);
    };
  }, [key]);
  const e = key ? cache.get(key) : undefined;
  const refresh = useCallback(() => (key ? load(key) : Promise.resolve()), [key]);
  return { data: e?.data as T | undefined, error: e?.error, loading: !!e?.loading, refresh };
}

/** Untuk aksi (POST/PUT/DELETE) dengan status sibuk. */
export function useAction<A extends unknown[], R>(fn: (...a: A) => Promise<R>) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (...a: A) => {
      setBusy(true);
      try {
        return await fn(...a);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  );
  return [run, busy] as const;
}

/** Semua daftar postingan (beranda, filter, simpanan) — bukan detail postingan. */
export const FEEDS = /^\/api\/posts(\?|$)/;
