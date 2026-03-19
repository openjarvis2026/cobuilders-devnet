import type { NextRequest } from 'next/server';
import { Fork } from '@/types/fork';

// Fork Management backend URL - configurable via environment variable
const FORK_BACKEND_URL = process.env.FORK_BACKEND_URL;

export async function GET(_request: NextRequest) {
  // If a backend URL is configured, proxy the request
  if (FORK_BACKEND_URL) {
    try {
      const response = await fetch(`${FORK_BACKEND_URL}/forks`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't cache - always fetch fresh data
        cache: 'no-store',
      });

      if (!response.ok) {
        return Response.json(
          { error: 'Backend returned an error', status: response.status },
          { status: response.status }
        );
      }

      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      return Response.json(
        { error: 'Failed to connect to fork backend' },
        { status: 502 }
      );
    }
  }

  // No backend configured - return empty list
  // In production, set FORK_BACKEND_URL to point to the fork management API
  const forks: Fork[] = [];
  return Response.json(forks);
}
