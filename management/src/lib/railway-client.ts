/**
 * Railway API Client
 *
 * Provides typed access to the Railway GraphQL API for fork lifecycle management.
 * Each fork is represented as a Railway service with labels used as metadata tags.
 *
 * Required environment variables:
 *   RAILWAY_API_TOKEN   – Railway API token with project read/write access
 *   RAILWAY_PROJECT_ID  – The Railway project ID where forks are deployed
 *   RAILWAY_TEMPLATE_ID – (optional) The Railway template ID for the CoBuilders Devnet
 *
 * @see https://docs.railway.app/reference/public-api
 */

import type { DeploymentStatus } from "./types";

const RAILWAY_API_URL = "https://backboard.railway.app/graphql/v2";

/** Labels used to identify and describe CoBuilders fork services */
export const FORK_LABELS = {
  MARKER: "cobuilders-fork",
  NAME: "fork-name",
  CHAIN: "fork-chain",
  CREATED_AT: "created-at",
} as const;

/** Tag value that marks a Railway service as a CoBuilders fork */
const FORK_MARKER_VALUE = "true";

/** Mapping from Railway deployment status to our internal status type */
const RAILWAY_STATUS_MAP: Record<string, DeploymentStatus> = {
  SUCCESS: "active",
  ACTIVE: "active",
  DEPLOYING: "deploying",
  BUILDING: "deploying",
  INITIALIZING: "deploying",
  QUEUED: "deploying",
  WAITING: "deploying",
  CRASHED: "failed",
  FAILED: "failed",
  ERROR: "failed",
  REMOVED: "failed",
  REMOVING: "failed",
};

export function mapRailwayStatus(railwayStatus: string): DeploymentStatus {
  return RAILWAY_STATUS_MAP[railwayStatus.toUpperCase()] ?? "deploying";
}

// ---------------------------------------------------------------------------
// Low-level GraphQL helper
// ---------------------------------------------------------------------------

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function railwayQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) {
    throw new Error("RAILWAY_API_TOKEN environment variable is not set");
  }

  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Railway API HTTP error: ${response.status} ${response.statusText}`
    );
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `Railway API error: ${json.errors.map((e) => e.message).join("; ")}`
    );
  }

  if (!json.data) {
    throw new Error("Railway API returned no data");
  }

  return json.data;
}

// ---------------------------------------------------------------------------
// Railway API types (subset of the Railway GraphQL schema)
// ---------------------------------------------------------------------------

interface RailwayService {
  id: string;
  name: string;
  createdAt: string;
  labels: Record<string, string> | null;
}

interface RailwayDeployment {
  id: string;
  status: string;
  url: string | null;
  createdAt: string;
  staticUrl: string | null;
}

interface RailwayDomain {
  domain: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parameters for creating a new fork service.
 */
export interface CreateForkServiceParams {
  forkName: string;
  chain: string;
  environmentId: string;
}

/**
 * Result of creating a fork service.
 */
export interface CreateForkServiceResult {
  serviceId: string;
  deploymentId: string;
}

/**
 * Creates a new Railway service from the CoBuilders Devnet GitHub source,
 * sets the required environment variables, and applies fork metadata labels.
 *
 * Returns the new service ID and the triggered deployment ID.
 */
export async function createForkService(
  params: CreateForkServiceParams
): Promise<CreateForkServiceResult> {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) {
    throw new Error("RAILWAY_PROJECT_ID environment variable is not set");
  }

  const alchemyApiKey = process.env.ALCHEMY_API_KEY ?? "IvEozujWR5miwiLQVdQU0";
  const now = new Date().toISOString();

  // Step 1: Create the service
  const createData = await railwayQuery<{
    serviceCreate: { id: string };
  }>(
    `mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
      }
    }`,
    {
      input: {
        projectId,
        name: `fork-${params.forkName}`,
        source: {
          repo: "CoBuilders-xyz/cobuilders-devnet",
        },
      },
    }
  );

  const serviceId = createData.serviceCreate.id;

  // Step 2: Set environment variables (fork configuration)
  await railwayQuery<{ variableCollectionUpsert: boolean }>(
    `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId,
        environmentId: params.environmentId,
        serviceId,
        variables: {
          NETWORK_NAME: params.forkName,
          DEFAULT_CHAIN: params.chain,
          ALCHEMY_API_KEY: alchemyApiKey,
          BLOCK_TIME: "2",
          ACCOUNTS: "10",
          BALANCE: "10000",
        },
      },
    }
  );

  // Step 3: Apply fork metadata as service labels
  await railwayQuery<{ serviceUpdate: { id: string } }>(
    `mutation ServiceUpdate($id: String!, $input: ServiceUpdateInput!) {
      serviceUpdate(id: $id, input: $input) {
        id
      }
    }`,
    {
      id: serviceId,
      input: {
        labels: {
          [FORK_LABELS.MARKER]: FORK_MARKER_VALUE,
          [FORK_LABELS.NAME]: params.forkName,
          [FORK_LABELS.CHAIN]: params.chain,
          [FORK_LABELS.CREATED_AT]: now,
        },
      },
    }
  );

  // Step 4: Trigger the deployment
  const deployData = await railwayQuery<{
    serviceInstanceRedeploy: { id: string };
  }>(
    `mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId) {
        id
      }
    }`,
    {
      serviceId,
      environmentId: params.environmentId,
    }
  );

  const deploymentId = deployData.serviceInstanceRedeploy.id;

  return { serviceId, deploymentId };
}

/**
 * Returns the status of a specific deployment.
 */
export async function getDeploymentStatus(
  deploymentId: string
): Promise<{ status: DeploymentStatus; url: string | null }> {
  const data = await railwayQuery<{ deployment: RailwayDeployment }>(
    `query Deployment($id: String!) {
      deployment(id: $id) {
        id
        status
        url
        staticUrl
      }
    }`,
    { id: deploymentId }
  );

  const { deployment } = data;
  const url = deployment.staticUrl ?? deployment.url ?? null;
  return {
    status: mapRailwayStatus(deployment.status),
    url,
  };
}

/**
 * Polls a deployment until it reaches a terminal state (active or failed)
 * or the timeout elapses.
 *
 * @param deploymentId  Railway deployment ID to poll
 * @param pollIntervalMs  Milliseconds between polls (default 5 000)
 * @param timeoutMs       Maximum wait time in milliseconds (default 5 minutes)
 */
export async function pollDeploymentUntilHealthy(
  deploymentId: string,
  pollIntervalMs = 5_000,
  timeoutMs = 5 * 60 * 1_000
): Promise<{ status: DeploymentStatus; url: string | null }> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await getDeploymentStatus(deploymentId);

    if (result.status === "active" || result.status === "failed") {
      return result;
    }

    // Still deploying — wait before next poll
    await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  // Timed out
  return { status: "failed", url: null };
}

/**
 * Retrieves all Railway services in the project that carry the
 * `cobuilders-fork=true` label.
 */
export async function listForkServices(): Promise<
  Array<{
    serviceId: string;
    labels: Record<string, string>;
    latestDeployment: {
      id: string;
      status: string;
      url: string | null;
    } | null;
  }>
> {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) {
    throw new Error("RAILWAY_PROJECT_ID environment variable is not set");
  }

  const data = await railwayQuery<{
    project: {
      services: {
        edges: Array<{
          node: RailwayService & {
            serviceInstances: {
              edges: Array<{
                node: {
                  latestDeployment: {
                    id: string;
                    status: string;
                    url: string | null;
                    staticUrl: string | null;
                  } | null;
                };
              }>;
            };
          };
        }>;
      };
    };
  }>(
    `query ProjectServices($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
              createdAt
              labels
              serviceInstances {
                edges {
                  node {
                    latestDeployment {
                      id
                      status
                      url
                      staticUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { projectId }
  );

  const services = data.project.services.edges.map((e) => e.node);

  // Filter to only CoBuilders fork services
  const forkServices = services.filter(
    (svc) => svc.labels?.[FORK_LABELS.MARKER] === FORK_MARKER_VALUE
  );

  return forkServices.map((svc) => {
    const instance = svc.serviceInstances.edges[0]?.node ?? null;
    const deployment = instance?.latestDeployment ?? null;

    return {
      serviceId: svc.id,
      labels: svc.labels ?? {},
      latestDeployment: deployment
        ? {
            id: deployment.id,
            status: deployment.status,
            url: deployment.staticUrl ?? deployment.url ?? null,
          }
        : null,
    };
  });
}

/**
 * Deletes a Railway service by service ID.
 * Throws if the Railway API returns an error.
 */
export async function deleteForkService(serviceId: string): Promise<void> {
  await railwayQuery<{ serviceDelete: boolean }>(
    `mutation ServiceDelete($id: String!) {
      serviceDelete(id: $id)
    }`,
    { id: serviceId }
  );
}

/**
 * Returns the default environment ID for the project (used when creating
 * services and setting variables).
 */
export async function getDefaultEnvironmentId(): Promise<string> {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) {
    throw new Error("RAILWAY_PROJECT_ID environment variable is not set");
  }

  const data = await railwayQuery<{
    project: {
      environments: {
        edges: Array<{ node: { id: string; name: string } }>;
      };
    };
  }>(
    `query ProjectEnvironments($projectId: String!) {
      project(id: $projectId) {
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }`,
    { projectId }
  );

  const envs = data.project.environments.edges.map((e) => e.node);
  // Prefer "production" environment, fall back to first available
  const production = envs.find(
    (e) => e.name.toLowerCase() === "production"
  );
  const env = production ?? envs[0];

  if (!env) {
    throw new Error("No environments found in Railway project");
  }

  return env.id;
}
