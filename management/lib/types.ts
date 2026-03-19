export interface Fork {
  id: string;
  name: string;
  chain: string;
  status: "running" | "stopped" | "deploying" | "error";
  dashboardUrl: string;
  rpcUrl: string;
  createdAt: string;
}

export interface CreateForkRequest {
  name: string;
  chain: string;
}

export interface CreateForkResponse {
  fork: Fork;
}

export interface CreateForkForm {
  name: string;
  chain: string;
  isSubmitting: boolean;
  error: string | null;
}

export const CHAINS = [
  { value: "base-mainnet", label: "Base Mainnet" },
  { value: "opt-mainnet", label: "Optimism Mainnet" },
  { value: "eth-mainnet", label: "Ethereum Mainnet" },
  { value: "arb-mainnet", label: "Arbitrum One" },
  { value: "polygon-mainnet", label: "Polygon Mainnet" },
  { value: "zksync-mainnet", label: "zkSync Era" },
] as const;

export function validateForkName(name: string): string | null {
  if (name.length < 3 || name.length > 32) {
    return "Fork name must be 3-32 characters";
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return "Only lowercase letters, numbers, and hyphens allowed";
  }
  return null;
}
