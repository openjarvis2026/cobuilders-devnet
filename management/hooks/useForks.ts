/**
 * useForks hook
 *
 * Fetches the fork list from the API and provides auto-refresh logic.
 *
 * AC-MDU-001.1: Fetch fork list from backend on load.
 * AC-MDU-001.6: Provide manual refresh capability.
 * AC-MDU-006.4: Auto-refresh every 10 seconds when any fork is deploying.
 * AC-MDU-006.5: Stop auto-refresh when all forks are active or failed.
 * AC-MDU-004.4: Provide deleteFork to call DELETE /api/forks/:id.
 * AC-MDU-004.5: Remove fork from list immediately on successful deletion.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ForkListItem } from '@/lib/types';

const AUTO_REFRESH_INTERVAL_MS = 10_000;

export interface UseForksResult {
  forks: ForkListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /**
   * Deletes a fork by ID. Resolves with the success message on success.
   * Rejects with an Error containing the failure message on failure.
   * On success the fork is immediately removed from the local list.
   *
   * AC-FM-003.1 / AC-FM-003.5: Calls DELETE /api/forks/:id and removes fork
   * from subsequent list state.
   */
  deleteFork: (id: string) => Promise<string>;
}

export function useForks(): UseForksResult {
  const [forks, setForks] = useState<ForkListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchForks = useCallback(async () => {
    try {
      const response = await fetch('/api/forks');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setForks(data.forks ?? []);
      setError(null);
    } catch {
      // AC-MDU-001.5: Display error message when fetch fails
      setError('Unable to load forks. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchForks();
  }, [fetchForks]);

  // Initial fetch on mount
  useEffect(() => {
    fetchForks();
  }, [fetchForks]);

  // AC-MDU-006.4 / AC-MDU-006.5: Auto-refresh when any fork is deploying
  useEffect(() => {
    const hasDeployingFork = forks.some((f) => f.status === 'deploying');

    if (hasDeployingFork) {
      // Start interval if not already running
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          fetchForks();
        }, AUTO_REFRESH_INTERVAL_MS);
      }
    } else {
      // Stop interval when no deploying forks remain
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [forks, fetchForks]);

  /**
   * AC-MDU-004.4 / AC-FM-003.1: Send DELETE request and update local state.
   */
  const deleteFork = useCallback(async (id: string): Promise<string> => {
    const response = await fetch(`/api/forks/${id}`, { method: 'DELETE' });
    const data = await response.json() as { success: boolean; message: string };

    if (!response.ok || !data.success) {
      throw new Error(data.message ?? 'Unable to delete fork. Try again later.');
    }

    // AC-MDU-004.5 / AC-FM-003.5: Immediately remove fork from local list
    setForks((prev) => prev.filter((f) => f.id !== id));

    return data.message;
  }, []);

  return { forks, loading, error, refresh, deleteFork };
}
