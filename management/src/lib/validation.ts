/**
 * Input validation helpers for fork creation requests.
 */

/** Chains supported as fork sources (AC-FM-006.1) */
export const SUPPORTED_CHAINS = [
  "base-mainnet",
  "opt-mainnet",
  "eth-mainnet",
  "arb-mainnet",
  "polygon-mainnet",
  "zksync-mainnet",
] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

/** Regex: lowercase letters, numbers, and hyphens only (AC-FM-005.1) */
const FORK_NAME_PATTERN = /^[a-z0-9-]+$/;

/** Length bounds for fork names (AC-FM-005.2) */
const FORK_NAME_MIN_LEN = 3;
const FORK_NAME_MAX_LEN = 32;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a fork name.
 * Returns an error message string, or null when valid.
 */
export function validateForkName(name: unknown): string | null {
  if (typeof name !== "string" || name.length === 0) {
    return "Fork name is required.";
  }
  if (name.length < FORK_NAME_MIN_LEN || name.length > FORK_NAME_MAX_LEN) {
    return `Fork name must be between ${FORK_NAME_MIN_LEN} and ${FORK_NAME_MAX_LEN} characters.`;
  }
  if (!FORK_NAME_PATTERN.test(name)) {
    return "Fork name may only contain lowercase letters, numbers, and hyphens.";
  }
  return null;
}

/**
 * Validates a chain identifier.
 * Returns an error message string, or null when valid.
 */
export function validateChain(chain: unknown): string | null {
  if (typeof chain !== "string" || chain.length === 0) {
    return "Chain is required.";
  }
  if (!SUPPORTED_CHAINS.includes(chain as SupportedChain)) {
    return `Unsupported chain "${chain}". Supported chains: ${SUPPORTED_CHAINS.join(", ")}.`;
  }
  return null;
}
