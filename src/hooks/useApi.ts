'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, toApiError, type ApiErrorShape } from '@/lib/api';
import type { PaginationMeta } from '@/types';

interface UseFetchResult<T> {
  data: T | null;
  meta: PaginationMeta | null;
  loading: boolean;
  error: ApiErrorShape | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * GET helper with loading/error state and a stale-response guard.
 *
 * `url` is the dependency: when a filter changes the caller rebuilds the URL,
 * which re-runs the fetch. Responses from superseded requests are discarded
 * so fast typing in a search box cannot render older results.
 */
export function useFetch<T>(url: string | null, options?: { skip?: boolean }): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(!options?.skip && Boolean(url));
  const [error, setError] = useState<ApiErrorShape | null>(null);

  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!url || options?.skip) {
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await apiGet<T>(url);
      // Ignore anything that is no longer the newest request.
      if (id !== requestId.current || !mounted.current) return;
      setData(response.data);
      setMeta(response.meta ?? null);
    } catch (caught) {
      if (id !== requestId.current || !mounted.current) return;
      setError(toApiError(caught));
    } finally {
      if (id === requestId.current && mounted.current) setLoading(false);
    }
  }, [url, options?.skip]);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, meta, loading, error, refetch: run, setData };
}

/** Debounces a rapidly-changing value, e.g. a search input. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Tracks whether a media query currently matches. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
