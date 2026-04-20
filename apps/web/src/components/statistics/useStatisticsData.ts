'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { StatisticsFilters, StatisticsResponse } from '@laundry/domain';
import { supabase } from '@/lib/supabase';

const CACHE_TTL_MS = 60_000;
const responseCache = new Map<string, { data: StatisticsResponse; timestamp: number }>();
const inflight = new Map<string, Promise<StatisticsResponse>>();

function buildKey(filters: StatisticsFilters) {
  return `${filters.startDate}|${filters.endDate}|${filters.typeFilter}`;
}

async function fetchStatistics(key: string, filters: StatisticsFilters, signal: AbortSignal): Promise<StatisticsResponse> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Sess\u00e3o expirada. Fa\u00e7a login novamente.');

    const search = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      typeFilter: filters.typeFilter,
    });

    const response = await fetch(`/api/statistics?${search.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      throw new Error(errorPayload?.error || 'N\u00e3o foi poss\u00edvel carregar as estat\u00edsticas.');
    }

    const data = await response.json() as StatisticsResponse;
    responseCache.set(key, { data, timestamp: Date.now() });
    return data;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

export function useStatisticsData(filters: StatisticsFilters) {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const latestKeyRef = useRef<string>('');
  const dataRef = useRef<StatisticsResponse | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async (force = false) => {
    const key = buildKey(filters);
    latestKeyRef.current = key;
    const cached = responseCache.get(key);
    const isFresh = cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS;

    if (cached) {
      setData(cached.data);
      setIsLoading(false);
      setError(null);
      if (isFresh && !force) {
        setIsRefreshing(false);
        return;
      }
      setIsRefreshing(true);
    } else {
      setIsLoading(dataRef.current == null);
      setIsRefreshing(dataRef.current != null);
    }

    try {
      const next = await fetchStatistics(key, filters, new AbortController().signal);
      if (latestKeyRef.current !== key) return;
      startTransition(() => {
        setData(next);
        setError(null);
      });
    } catch (fetchError) {
      if (latestKeyRef.current !== key) return;
      setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar estat\u00edsticas.');
    } finally {
      if (latestKeyRef.current === key) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    const key = buildKey(filters);
    latestKeyRef.current = key;

    const cached = responseCache.get(key);
    const isFresh = cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS;

    if (cached) {
      setData(cached.data);
      setIsLoading(false);
      setError(null);
      if (isFresh) {
        setIsRefreshing(false);
        return () => controller.abort();
      }
      setIsRefreshing(true);
    } else {
      setIsLoading(dataRef.current == null);
      setIsRefreshing(dataRef.current != null);
    }

    fetchStatistics(key, filters, controller.signal)
      .then((next) => {
        if (controller.signal.aborted || latestKeyRef.current !== key) return;
        startTransition(() => {
          setData(next);
          setError(null);
        });
      })
      .catch((fetchError) => {
        if (controller.signal.aborted || latestKeyRef.current !== key) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Falha ao carregar estat\u00edsticas.');
      })
      .finally(() => {
        if (!controller.signal.aborted && latestKeyRef.current === key) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [filters]);

  return useMemo(() => ({
    data,
    error,
    isLoading,
    isPending,
    isRefreshing,
    reload: () => load(true),
  }), [data, error, isLoading, isPending, isRefreshing, load]);
}
