/**
 * Deployment status for a fork instance.
 * Maps from Railway's deployment status values.
 */
export type DeploymentStatus = "active" | "deploying" | "failed";

/**
 * A fork represents a single Railway service instance running the CoBuilders Devnet.
 */
export interface Fork {
  /** Railway service ID used as the stable identifier for this fork */
  id: string;
  /** User-provided fork name (stored as Railway service label `fork-name`) */
  name: string;
  /** Chain identifier e.g. `base-mainnet` (stored as label `fork-chain`) */
  chain: string;
  /** ISO 8601 timestamp when the fork was created (stored as label `created-at`) */
  createdAt: string;
  /** Public dashboard URL served by this fork instance */
  dashboardUrl: string;
  /** RPC endpoint URL (`{dashboardUrl}/rpc`) */
  rpcUrl: string;
  /** Current health state of the fork's latest deployment */
  status: DeploymentStatus;
}

/**
 * Request body for POST /api/forks
 */
export interface CreateForkRequest {
  name: string;
  chain: string;
}

/**
 * Response body for POST /api/forks
 */
export interface CreateForkResponse {
  id: string;
  name: string;
  chain: string;
  dashboardUrl: string;
  rpcUrl: string;
  status: string;
}

/**
 * Response body for GET /api/forks
 */
export interface ListForksResponse {
  forks: Fork[];
}

/**
 * Response body for DELETE /api/forks/[id]
 */
export interface DeleteForkResponse {
  success: boolean;
  message: string;
}
