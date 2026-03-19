/**
 * GET /api/forks
 *
 * Queries the Railway API for all fork deployments in the project
 * tagged with `cobuilders-fork=true` and returns them sorted by
 * creation timestamp (newest first).
 *
 * AC-FM-002.1: Query Railway API for deployments with cobuilders-fork=true tag.
 * AC-FM-002.2: Extract fork metadata from Railway tags.
 * AC-FM-002.3: Construct RPC and dashboard URLs from Railway public URLs.
 * AC-FM-002.4: Return sorted list with all required fields.
 * AC-FM-002.5: Return error when Railway API is unreachable.
 */

import { NextResponse } from 'next/server';
import { railwayQuery } from '@/lib/railway-client';
import { RailwayApiError } from '@/lib/types';
import type { ForkListItem, ForkStatus, ForksApiResponse } from '@/lib/types';

const FORK_TAG_KEY = 'cobuilders-fork';
const FORK_TAG_VALUE = 'true';

interface DeploymentMeta {
  [key: string]: string;
}

interface RailwayDeploymentNode {
  id: string;
  status: string;
  url?: string;
  meta?: DeploymentMeta;
  createdAt: string;
}

interface GetForksQueryResponse {
  deployments: {
    edges: Array<{
      node: RailwayDeploymentNode;
    }>;
  };
}

const GET_FORKS_QUERY = `
  query GetForks($projectId: String!) {
    deployments(input: { projectId: $projectId }) {
      edges {
        node {
          id
          status
          url
          meta
          createdAt
        }
      }
    }
  }
`;

/**
 * Maps Railway deployment status to application fork status.
 *
 * AC-FM-002.4: Status mapping — active/deploying/failed.
 */
function mapRailwayStatus(status: string): ForkStatus {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return 'active';
    case 'BUILDING':
    case 'DEPLOYING':
    case 'INITIALIZING':
    case 'WAITING':
    case 'RESTARTING':
      return 'deploying';
    case 'CRASHED':
    case 'FAILED':
    case 'REMOVED':
    case 'REMOVING':
    case 'SKIPPED':
    default:
      return 'failed';
  }
}

export async function GET(): Promise<NextResponse<ForksApiResponse | { error: string; details?: string }>> {
  const projectId = process.env.RAILWAY_PROJECT_ID;

  if (!projectId) {
    console.error('[GET /api/forks] RAILWAY_PROJECT_ID environment variable is not set');
    return NextResponse.json(
      { error: 'RAILWAY_PROJECT_ID environment variable is not set' },
      { status: 500 }
    );
  }

  try {
    const data = await railwayQuery<GetForksQueryResponse>(
      GET_FORKS_QUERY,
      { projectId },
      { operation: 'GetForks', projectId }
    );

    // AC-FM-002.1: Filter deployments tagged with cobuilders-fork=true
    // AC-FM-002.2: Extract metadata from Railway tags (meta field)
    const forks: ForkListItem[] = data.deployments.edges
      .filter(({ node }) => {
        const meta = node.meta ?? {};
        return meta[FORK_TAG_KEY] === FORK_TAG_VALUE;
      })
      .map(({ node }) => {
        const meta = node.meta ?? {};

        // AC-FM-002.3: Construct dashboard and RPC URLs from Railway public URL
        const dashboardUrl = node.url ?? '';
        const rpcUrl = dashboardUrl ? `${dashboardUrl}/rpc` : '';

        // Use created-at tag if available, fall back to Railway's createdAt
        const createdAt = meta['created-at'] ?? node.createdAt;

        return {
          id: node.id,
          name: meta['fork-name'] ?? 'Unknown',
          chain: meta['fork-chain'] ?? 'unknown',
          createdAt,
          dashboardUrl,
          rpcUrl,
          status: mapRailwayStatus(node.status),
        };
      })
      // AC-FM-002.4: Sort by creation timestamp, newest first
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ forks });
  } catch (error) {
    if (error instanceof RailwayApiError) {
      // AC-FM-002.5: Return error when Railway API is unreachable
      console.error('[GET /api/forks] Railway API error:', error.message);
      return NextResponse.json(
        {
          error: 'Unable to retrieve fork list from Railway API',
          details: error.message,
        },
        { status: 502 }
      );
    }

    console.error('[GET /api/forks] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unable to retrieve fork list' },
      { status: 500 }
    );
  }
}
