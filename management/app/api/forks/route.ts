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
 *
 * POST /api/forks
 *
 * Creates a new fork deployment on Railway.
 *
 * AC-FM-001.1: Call Railway API to deploy a new service from the CoBuilders Devnet template.
 * AC-FM-001.2: Set Railway environment variables for the new deployment.
 * AC-FM-001.3: Apply Railway tags to the new deployment.
 * AC-FM-001.4: Return the Railway deployment ID and wait for healthy state.
 * AC-FM-001.5: Return fork public URL and RPC endpoint URL when healthy.
 * AC-FM-001.6: Return error message on failure.
 * AC-FM-005.1-5.3: Validate fork name format.
 * AC-FM-006.1-6.3: Validate chain selection against supported chains.
 */

import { NextResponse } from 'next/server';
import { railwayQuery, railwayMutate } from '@/lib/railway-client';
import { RailwayApiError } from '@/lib/types';
import { sleep } from '@/lib/utils';
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

// ---------------------------------------------------------------------------
// POST /api/forks — Create a new fork deployment
// ---------------------------------------------------------------------------

/**
 * AC-FM-006.1: Supported chain identifiers.
 */
const SUPPORTED_CHAINS = [
  'base-mainnet',
  'opt-mainnet',
  'eth-mainnet',
  'arb-mainnet',
  'polygon-mainnet',
  'zksync-mainnet',
] as const;

/**
 * AC-FM-005.1–5.2: Validate fork name — lowercase letters, numbers, hyphens; 3–32 chars.
 * Returns an error message string if invalid, or null if valid.
 */
function validateForkName(name: string): string | null {
  if (!name || name.length < 3 || name.length > 32) {
    return 'Fork name must be 3-32 characters';
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Only lowercase letters, numbers, and hyphens allowed';
  }
  return null;
}

// Railway mutations and queries for fork creation

const SERVICE_CREATE_MUTATION = `
  mutation ServiceCreate($input: ServiceCreateInput!) {
    serviceCreate(input: $input) {
      id
      name
      projectId
    }
  }
`;

const VARIABLE_COLLECTION_UPSERT_MUTATION = `
  mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
    variableCollectionUpsert(input: $input)
  }
`;

const SERVICE_INSTANCE_DEPLOY_MUTATION = `
  mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
    serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
  }
`;

const GET_SERVICE_DEPLOYMENTS_QUERY = `
  query GetServiceDeployments($serviceId: String!, $environmentId: String!) {
    deployments(input: { serviceId: $serviceId, environmentId: $environmentId }) {
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

interface ServiceCreateResponse {
  serviceCreate: {
    id: string;
    name: string;
    projectId: string;
  };
}

interface ServiceDeploymentsResponse {
  deployments: {
    edges: Array<{
      node: RailwayDeploymentNode;
    }>;
  };
}

/** Response body for POST /api/forks */
interface CreateForkResponse {
  id: string;
  name: string;
  chain: string;
  dashboardUrl: string;
  rpcUrl: string;
  status: 'active' | 'deploying';
}

/** Deployment status polling constants */
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 60; // 5 minutes

/** Terminal failure statuses that should stop polling */
const TERMINAL_FAILURE_STATUSES = new Set([
  'CRASHED',
  'FAILED',
  'REMOVED',
  'REMOVING',
  'SKIPPED',
]);

/**
 * Polls Railway until the deployment reaches SUCCESS or a terminal failure.
 * Returns the final deployment node or throws on timeout/failure.
 *
 * AC-FM-001.4: Wait for deployment to reach healthy state before returning.
 */
async function pollDeploymentUntilHealthy(
  serviceId: string,
  environmentId: string
): Promise<RailwayDeploymentNode> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(POLL_INTERVAL_MS);
    }

    const data = await railwayQuery<ServiceDeploymentsResponse>(
      GET_SERVICE_DEPLOYMENTS_QUERY,
      { serviceId, environmentId },
      { operation: 'GetServiceDeployments', serviceId }
    );

    const edges = data.deployments.edges;
    if (edges.length === 0) {
      // No deployment yet — keep polling
      continue;
    }

    // Take the most recent deployment (first edge, sorted newest-first by Railway)
    const deployment = edges[0].node;
    const status = deployment.status.toUpperCase();

    if (status === 'SUCCESS') {
      return deployment;
    }

    if (TERMINAL_FAILURE_STATUSES.has(status)) {
      throw new Error(`Deployment failed with status: ${deployment.status}`);
    }

    // Still deploying — continue polling
  }

  throw new Error('Deployment timed out after 5 minutes');
}

/**
 * POST /api/forks
 *
 * Creates a new Railway service (fork), sets environment variables and tags,
 * triggers a deployment, polls until healthy, then returns fork info.
 *
 * AC-FM-001.1–001.6, AC-FM-005.1–005.3, AC-FM-006.1–006.3
 */
export async function POST(
  request: Request
): Promise<NextResponse<CreateForkResponse | { error: string; details?: string }>> {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

  if (!projectId) {
    console.error('[POST /api/forks] RAILWAY_PROJECT_ID environment variable is not set');
    return NextResponse.json(
      { error: 'RAILWAY_PROJECT_ID environment variable is not set' },
      { status: 500 }
    );
  }

  if (!environmentId) {
    console.error('[POST /api/forks] RAILWAY_ENVIRONMENT_ID environment variable is not set');
    return NextResponse.json(
      { error: 'RAILWAY_ENVIRONMENT_ID environment variable is not set' },
      { status: 500 }
    );
  }

  // Parse request body
  let body: { name?: unknown; chain?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const chain = typeof body.chain === 'string' ? body.chain.trim() : '';

  // AC-FM-005.1–5.3: Validate fork name
  const nameError = validateForkName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  // AC-FM-006.1–6.2: Validate chain selection
  if (!SUPPORTED_CHAINS.includes(chain as (typeof SUPPORTED_CHAINS)[number])) {
    return NextResponse.json(
      {
        error: `Invalid chain. Supported chains: ${SUPPORTED_CHAINS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const alchemyApiKey = process.env.ALCHEMY_API_KEY ?? '';
  const createdAt = new Date().toISOString();

  try {
    // AC-FM-001.1: Create new Railway service for the fork
    console.info('[POST /api/forks] Creating Railway service', { name, chain });
    const serviceData = await railwayMutate<ServiceCreateResponse>(
      SERVICE_CREATE_MUTATION,
      {
        input: {
          projectId,
          name: `fork-${name}`,
          // Use a Docker image if RAILWAY_DEVNET_IMAGE is set, otherwise
          // build from the GitHub repo via its Dockerfile (railway.toml).
          source: process.env.RAILWAY_DEVNET_IMAGE
            ? { image: process.env.RAILWAY_DEVNET_IMAGE }
            : { repo: process.env.RAILWAY_DEVNET_REPO ?? 'CoBuilders-xyz/cobuilders-devnet' },
        },
      },
      { operation: 'ServiceCreate', projectId, name }
    );

    const serviceId = serviceData.serviceCreate.id;
    console.info('[POST /api/forks] Service created', { serviceId, name });

    // AC-FM-001.2: Set environment variables for the new deployment
    // AC-FM-001.3: Tags stored as env vars prefixed with _FORK_META_ so the GET
    //              endpoint can read them from deployment meta if Railway surfaces them,
    //              and also as dedicated variables for reliable tag-based filtering.
    const variables: Record<string, string> = {
      NETWORK_NAME: name,
      DEFAULT_CHAIN: chain,
      ALCHEMY_API_KEY: alchemyApiKey,
      BLOCK_TIME: '2',
      ACCOUNTS: '10',
      BALANCE: '10000',
      // Railway deployment meta tags (surfaced via the deployment `meta` field)
      'cobuilders-fork': 'true',
      'fork-name': name,
      'fork-chain': chain,
      'created-at': createdAt,
    };

    await railwayMutate(
      VARIABLE_COLLECTION_UPSERT_MUTATION,
      {
        input: {
          projectId,
          environmentId,
          serviceId,
          variables,
        },
      },
      { operation: 'VariableCollectionUpsert', serviceId }
    );

    console.info('[POST /api/forks] Variables set, triggering deployment', { serviceId });

    // Trigger the deployment explicitly after variable setup
    try {
      await railwayMutate(
        SERVICE_INSTANCE_DEPLOY_MUTATION,
        { serviceId, environmentId },
        { operation: 'ServiceInstanceDeploy', serviceId }
      );
    } catch (deployErr) {
      // Some Railway setups auto-deploy on variable upsert; log and continue
      console.warn('[POST /api/forks] serviceInstanceDeploy failed (may auto-deploy):', deployErr);
    }

    // AC-FM-001.4: Poll until the deployment is healthy
    console.info('[POST /api/forks] Polling deployment status', { serviceId });
    const deployment = await pollDeploymentUntilHealthy(serviceId, environmentId);

    // AC-FM-001.5: Return fork URL and RPC endpoint URL
    const dashboardUrl = deployment.url ?? '';
    const rpcUrl = dashboardUrl ? `${dashboardUrl}/rpc` : '';

    console.info('[POST /api/forks] Fork created successfully', {
      serviceId,
      deploymentId: deployment.id,
      dashboardUrl,
    });

    return NextResponse.json({
      id: deployment.id,
      name,
      chain,
      dashboardUrl,
      rpcUrl,
      status: 'active',
    });
  } catch (error) {
    // AC-FM-001.6: Return error message on failure
    if (error instanceof RailwayApiError) {
      console.error('[POST /api/forks] Railway API error:', error.message);
      return NextResponse.json(
        {
          error: 'Railway API error',
          details: error.message,
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/forks] Fork creation failed:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
