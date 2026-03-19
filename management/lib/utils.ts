import { RailwayApiError, RailwayErrorCode } from './types';

/**
 * Sleep for the given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry options for exponential backoff
 */
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs?: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 4000,
};

/**
 * Determines if an error is a transient failure that should be retried.
 * Only retries on 5xx errors and network timeouts; never retries 4xx errors.
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof RailwayApiError) {
    // Never retry auth or authorization failures
    if (
      error.code === RailwayErrorCode.AUTHENTICATION_FAILED ||
      error.code === RailwayErrorCode.AUTHORIZATION_FAILED ||
      error.code === RailwayErrorCode.NOT_FOUND
    ) {
      return false;
    }
    // Retry on transient errors (5xx)
    if (error.code === RailwayErrorCode.TRANSIENT_ERROR) {
      return true;
    }
    // Check status code
    if (error.statusCode !== undefined) {
      return error.statusCode >= 500;
    }
  }

  // Retry on network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * Executes a function with exponential backoff retry logic.
 * Only retries on transient failures (5xx errors, network timeouts).
 * Does not retry on 4xx errors (authentication, invalid parameters).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isTransientError(error)) {
        // Do not retry non-transient errors
        throw error;
      }

      if (attempt === opts.maxAttempts) {
        // Exhausted all attempts
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, ...
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(2, attempt - 1),
        opts.maxDelayMs ?? opts.initialDelayMs * Math.pow(2, opts.maxAttempts)
      );

      console.warn(
        `[Railway API] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Parses HTTP status codes and maps them to Railway error codes.
 */
export function mapHttpStatusToErrorCode(statusCode: number): RailwayErrorCode {
  if (statusCode === 401) {
    return RailwayErrorCode.AUTHENTICATION_FAILED;
  }
  if (statusCode === 403) {
    return RailwayErrorCode.AUTHORIZATION_FAILED;
  }
  if (statusCode === 404) {
    return RailwayErrorCode.NOT_FOUND;
  }
  if (statusCode >= 500) {
    return RailwayErrorCode.TRANSIENT_ERROR;
  }
  return RailwayErrorCode.UNKNOWN;
}

/**
 * Creates a descriptive error message for authentication/authorization failures.
 */
export function createAuthErrorMessage(statusCode: number): string {
  if (statusCode === 401) {
    return 'Railway API authentication failed: Invalid or missing API token. Please check RAILWAY_API_TOKEN.';
  }
  if (statusCode === 403) {
    return 'Railway API authorization failed: Insufficient permissions to perform this operation.';
  }
  return `Railway API error: HTTP ${statusCode}`;
}
