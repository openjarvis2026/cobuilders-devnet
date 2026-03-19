// Railway API response types

export interface RailwayEnvironment {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RailwayService {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RailwayProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  environments: {
    edges: Array<{
      node: RailwayEnvironment;
    }>;
  };
  services: {
    edges: Array<{
      node: RailwayService;
    }>;
  };
}

export interface RailwayDeployment {
  id: string;
  status: RailwayDeploymentStatus;
  createdAt: string;
  updatedAt: string;
  serviceId: string;
  environmentId: string;
  url?: string;
}

export type RailwayDeploymentStatus =
  | 'BUILDING'
  | 'CRASHED'
  | 'DEPLOYING'
  | 'FAILED'
  | 'INITIALIZING'
  | 'REMOVED'
  | 'REMOVING'
  | 'RESTARTING'
  | 'SKIPPED'
  | 'SUCCESS'
  | 'WAITING';

export interface RailwayVariable {
  name: string;
  value: string;
}

export interface RailwayServiceInstance {
  serviceId: string;
  environmentId: string;
  domains: {
    serviceDomains: Array<{
      domain: string;
    }>;
    customDomains: Array<{
      domain: string;
    }>;
  };
}

// GraphQL response wrapper
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

// Railway API error types
export enum RailwayErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  TRANSIENT_ERROR = 'TRANSIENT_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class RailwayApiError extends Error {
  constructor(
    public readonly code: RailwayErrorCode,
    message: string,
    public readonly statusCode?: number,
    public readonly requestContext?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RailwayApiError';
  }
}

// Fork types for the management dashboard
export interface ForkInstance {
  id: string;
  name: string;
  projectId: string;
  environmentId: string;
  serviceId: string;
  status: RailwayDeploymentStatus;
  rpcUrl?: string;
  createdAt: string;
  updatedAt: string;
  config: {
    chain: string;
    alchemyApiKey: string;
    networkName: string;
  };
}

export interface CreateForkRequest {
  name: string;
  chain: string;
  alchemyApiKey?: string;
  networkName?: string;
}
