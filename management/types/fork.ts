export type ForkStatus = 'deploying' | 'active' | 'failed';

export interface Fork {
  id: string;
  name: string;
  chain: string;
  status: ForkStatus;
  createdAt: string; // ISO timestamp
  dashboardUrl: string;
  rpcUrl: string;
  errorMessage?: string;
}
