'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Fork } from '@/types/fork';

interface UseForksResult {
  forks: Fork[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const AUTO_REFRESH_INTERVAL_MS = 10_000;

export function useForks(): UseForksResult {
  const [forks, setForks] = useState<Fork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchForks = useCallback(async () => {
    try {
      const response = await fetch('/api/forks', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: Fork[] = await response.json();
      // Sort by createdAt descending (newest first)
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setForks(sorted);
      setError(null);
    } catch {
      setError('Unable to load forks. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Start / stop auto-refresh based on deploying forks
  useEffect(() => {
    const hasDeploying = forks.some((f) => f.status === 'deploying');

    if (hasDeploying) {
      // Start interval if not already running
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchForks, AUTO_REFRESH_INTERVAL_MS);
      }
    } else {
      // Stop interval when no deploying forks
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [forks, fetchForks]);

  // Initial fetch on mount; clean up interval on unmount
  useEffect(() => {
    fetchForks();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchForks]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchForks();
  }, [fetchForks]);

  return { forks, loading, error, refresh };
}
