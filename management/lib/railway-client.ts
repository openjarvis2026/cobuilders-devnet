/**
 * Railway GraphQL API Client
 *
 * Provides authenticated access to Railway's GraphQL API with:
 * - Bearer token authentication via RAILWAY_API_TOKEN environment variable
 * - Retry logic with exponential backoff for transient failures
 * - Comprehensive error handling for auth, network, and API errors
 */

import { GraphQLClient, ClientError } from 'graphql-request';
import {
  RailwayApiError,
  RailwayErrorCode,
  GraphQLResponse,
} from './types';
import {
  withRetry,
  mapHttpStatusToErrorCode,
  createAuthErrorMessage,
} from './utils';

const RAILWAY_GRAPHQL_ENDPOINT = 'https://backboard.railway.app/graphql/v2';

/**
 * Validates that the Railway API token is configured and returns it.
 * Throws an error if the token is missing.
 *
 * AC-FM-004.1: Read Railway API token from environment variable at startup.
 * AC-FM-004.3: Fail with descriptive error when token is missing or invalid.
 */
function getRailwayApiToken(): string {
  const token = process.env.RAILWAY_API_TOKEN;

  if (!token) {
    const errorMsg =
      'RAILWAY_API_TOKEN environment variable is not set. ' +
      'The Railway API token must be configured before starting the service.';
    console.error('[Railway API] FATAL:', errorMsg);
    throw new RailwayApiError(
      RailwayErrorCode.AUTHENTICATION_FAILED,
      errorMsg
    );
  }

  return token;
}

/**
 * Creates a configured GraphQL client for the Railway API.
 *
 * AC-FM-004.2: Include Railway API token in authorization header of all requests.
 */
function createRailwayGraphQLClient(): GraphQLClient {
  const token = getRailwayApiToken();

  return new GraphQLClient(RAILWAY_GRAPHQL_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Maps a GraphQL client error to a RailwayApiError with appropriate error code.
 *
 * AC-FM-004.4: Return auth/authorization error on 401/403 responses.
 */
function handleClientError(
  error: ClientError,
  requestContext?: Record<string, unknown>
): RailwayApiError {
  const statusCode = error.response?.status;

  // Log all Railway API errors with request context
  console.error('[Railway API] Request failed:', {
    statusCode,
    message: error.message,
    errors: error.response?.errors,
    requestContext,
  });

  if (statusCode === 401 || statusCode === 403) {
    const code = mapHttpStatusToErrorCode(statusCode);
    const message = createAuthErrorMessage(statusCode);
    return new RailwayApiError(code, message, statusCode, requestContext);
  }

  if (statusCode !== undefined && statusCode >= 500) {
    return new RailwayApiError(
      RailwayErrorCode.TRANSIENT_ERROR,
      `Railway API transient error (HTTP ${statusCode}): ${error.message}`,
      statusCode,
      requestContext
    );
  }

  // Check for GraphQL-level auth errors
  const errors = error.response?.errors ?? [];
  for (const gqlError of errors) {
    const msg = gqlError.message?.toLowerCase() ?? '';
    if (msg.includes('unauthorized') || msg.includes('authentication')) {
      return new RailwayApiError(
        RailwayErrorCode.AUTHENTICATION_FAILED,
        `Railway API authentication failed: ${gqlError.message}`,
        statusCode,
        requestContext
      );
    }
    if (msg.includes('forbidden') || msg.includes('not allowed')) {
      return new RailwayApiError(
        RailwayErrorCode.AUTHORIZATION_FAILED,
        `Railway API authorization failed: ${gqlError.message}`,
        statusCode,
        requestContext
      );
    }
  }

  return new RailwayApiError(
    RailwayErrorCode.UNKNOWN,
    `Railway API error: ${error.message}`,
    statusCode,
    requestContext
  );
}

/**
 * Executes a Railway GraphQL query with retry logic and error handling.
 *
 * @param query - GraphQL query string
 * @param variables - GraphQL variables
 * @param requestContext - Optional context for error logging
 * @returns Typed response data
 */
export async function railwayQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  requestContext?: Record<string, unknown>
): Promise<T> {
  const client = createRailwayGraphQLClient();

  return withRetry(
    async () => {
      try {
        const data = await client.request<T>(query, variables);
        return data;
      } catch (error) {
        if (error instanceof ClientError) {
          throw handleClientError(error, requestContext);
        }

        // Network / fetch errors
        console.error('[Railway API] Network error:', {
          message: error instanceof Error ? error.message : error,
          requestContext,
        });

        throw new RailwayApiError(
          RailwayErrorCode.TRANSIENT_ERROR,
          `Railway API network error: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          requestContext
        );
      }
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 4000,
    }
  );
}

/**
 * Executes a Railway GraphQL mutation with retry logic and error handling.
 *
 * @param mutation - GraphQL mutation string
 * @param variables - GraphQL variables
 * @param requestContext - Optional context for error logging
 * @returns Typed response data
 */
export async function railwayMutate<T>(
  mutation: string,
  variables?: Record<string, unknown>,
  requestContext?: Record<string, unknown>
): Promise<T> {
  // Mutations use same underlying mechanism as queries in graphql-request
  return railwayQuery<T>(mutation, variables, requestContext);
}

/**
 * Tests the Railway API connection and token validity.
 * Useful for health checks and startup validation.
 */
export async function testRailwayConnection(): Promise<boolean> {
  const healthQuery = `
    query {
      me {
        id
        email
        name
      }
    }
  `;

  try {
    await railwayQuery(healthQuery, {}, { operation: 'testConnection' });
    console.info('[Railway API] Connection test successful');
    return true;
  } catch (error) {
    if (error instanceof RailwayApiError) {
      console.error('[Railway API] Connection test failed:', error.message);
      if (
        error.code === RailwayErrorCode.AUTHENTICATION_FAILED ||
        error.code === RailwayErrorCode.AUTHORIZATION_FAILED
      ) {
        // Re-throw auth errors so they propagate to startup (AC-FM-004.3)
        throw error;
      }
    } else {
      console.error('[Railway API] Connection test failed:', error);
    }
    return false;
  }
}
