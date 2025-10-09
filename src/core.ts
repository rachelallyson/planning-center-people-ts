import {
  type ErrorContext,
  handleNetworkError,
  handleTimeoutError,
  PcoError,
  retryWithBackoff,
  withErrorBoundary,
} from './error-handling';
import { PcoRateLimiter, RateLimitHeaders } from './rate-limiter';
import {
  Paginated,
  ResourceObject,
  Response as JsonApiResponse,
} from './types';
import { attemptTokenRefresh, hasRefreshTokenCapability, type TokenRefreshCallback, type TokenRefreshFailureCallback } from './auth';

// ===== PCO Client Configuration =====
export interface PcoClientConfig {
  /** Personal Access Token (for single-user apps) */
  personalAccessToken?: string;
  /** OAuth 2.0 Access Token (for multi-user apps) */
  accessToken?: string;
  /** OAuth 2.0 Refresh Token (for multi-user apps) */
  refreshToken?: string;
  /** Callback to handle token refresh */
  onTokenRefresh?: TokenRefreshCallback;
  /** Callback to handle token refresh failures */
  onTokenRefreshFailure?: TokenRefreshFailureCallback;
  /** App ID (for Personal Access Token auth) */
  appId?: string;
  /** App Secret (for Personal Access Token auth) */
  appSecret?: string;
  /** Base URL override (defaults to people/v2) */
  baseURL?: string;
  /** Rate limiting configuration */
  rateLimit?: {
    maxRequests: number;
    perMilliseconds: number;
  };
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: PcoError, attempt: number) => void;
  };
}

// Re-export PcoApiError for convenience
export { PcoApiError } from './api-error';

// ===== PCO Client State =====
export interface PcoClientState {
  config: PcoClientConfig;
  rateLimiter: PcoRateLimiter;
}

// ===== Core PCO Client Functions =====

/**
 * Create a PCO client state
 */
export function createPcoClient(config: PcoClientConfig): PcoClientState {
  // Initialize rate limiter
  const rateLimitConfig = config.rateLimit ?? {
    maxRequests: 100,
    perMilliseconds: 60000,
  };
  const rateLimiter = new PcoRateLimiter(
    rateLimitConfig.maxRequests,
    rateLimitConfig.perMilliseconds
  );

  return {
    config,
    rateLimiter,
  };
}

// ===== Generic API Methods =====

/**
 * Make a GET request to the PCO API for a single resource
 */
export async function getSingle<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
>(
  client: PcoClientState,
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<JsonApiResponse<TRes, TIncluded>> {
  return withErrorBoundary(
    () =>
      retryWithBackoff(
        () =>
          fetchRequestSingle<TRes, TIncluded>(
            client,
            'GET',
            endpoint,
            undefined,
            params,
            context
          ),
        {
          baseDelay: client.config.retry?.baseDelay ?? 1000,
          context,
          maxDelay: client.config.retry?.maxDelay ?? 30000,
          maxRetries: client.config.retry?.maxRetries ?? 3,
          onRetry: client.config.retry?.onRetry,
        }
      ),
    { ...context, endpoint, method: 'GET' }
  );
}

/**
 * Make a GET request to the PCO API for a list of resources
 */
export async function getList<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
>(
  client: PcoClientState,
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<Paginated<TRes, TIncluded>> {
  return withErrorBoundary(
    () =>
      retryWithBackoff(
        () =>
          fetchRequestList<TRes, TIncluded>(
            client,
            'GET',
            endpoint,
            undefined,
            params,
            context
          ),
        {
          baseDelay: client.config.retry?.baseDelay ?? 1000,
          context,
          maxDelay: client.config.retry?.maxDelay ?? 30000,
          maxRetries: client.config.retry?.maxRetries ?? 3,
          onRetry: client.config.retry?.onRetry,
        }
      ),
    { ...context, endpoint, method: 'GET' }
  );
}

/**
 * Make a POST request to the PCO API
 */
export async function post<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
>(
  client: PcoClientState,
  endpoint: string,
  data: Partial<TRes['attributes']>,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<JsonApiResponse<TRes, TIncluded>> {
  return withErrorBoundary(
    () =>
      retryWithBackoff(
        () =>
          fetchRequestSingle<TRes, TIncluded>(
            client,
            'POST',
            endpoint,
            data,
            params,
            context
          ),
        {
          baseDelay: client.config.retry?.baseDelay ?? 1000,
          context,
          maxDelay: client.config.retry?.maxDelay ?? 30000,
          maxRetries: client.config.retry?.maxRetries ?? 3,
          onRetry: client.config.retry?.onRetry,
        }
      ),
    { ...context, endpoint, method: 'POST' }
  );
}

/**
 * Make a PATCH request to the PCO API
 */
export async function patch<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
>(
  client: PcoClientState,
  endpoint: string,
  data: Partial<TRes['attributes']>,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<JsonApiResponse<TRes, TIncluded>> {
  return withErrorBoundary(
    () =>
      retryWithBackoff(
        () =>
          fetchRequestSingle<TRes, TIncluded>(
            client,
            'PATCH',
            endpoint,
            data,
            params,
            context
          ),
        {
          baseDelay: client.config.retry?.baseDelay ?? 1000,
          context,
          maxDelay: client.config.retry?.maxDelay ?? 30000,
          maxRetries: client.config.retry?.maxRetries ?? 3,
          onRetry: client.config.retry?.onRetry,
        }
      ),
    { ...context, endpoint, method: 'PATCH' }
  );
}

/**
 * Make a DELETE request to the PCO API
 */
export async function del(
  client: PcoClientState,
  endpoint: string,
  params?: Record<string, any>,
  context?: Partial<ErrorContext>
): Promise<void> {
  return withErrorBoundary(
    async () => {
      await retryWithBackoff(
        () =>
          makeFetchRequest(
            client,
            'DELETE',
            endpoint,
            undefined,
            params,
            context
          ),
        {
          baseDelay: client.config.retry?.baseDelay ?? 1000,
          context,
          maxDelay: client.config.retry?.maxDelay ?? 30000,
          maxRetries: client.config.retry?.maxRetries ?? 3,
          onRetry: client.config.retry?.onRetry,
        }
      );
    },
    { ...context, endpoint, method: 'DELETE' }
  );
}

/**
 * Get all pages of a paginated resource
 */
export async function getAllPages<T extends ResourceObject<string, any, any>>(
  client: PcoClientState,
  endpoint: string,
  params?: Record<string, any>,
  context?: Partial<ErrorContext>
): Promise<T[]> {
  return withErrorBoundary(
    async () => {
      const allData: T[] = [];
      let currentEndpoint = endpoint;
      let currentParams = { ...params };

      while (currentEndpoint) {
        const response = await getList<T>(
          client,
          currentEndpoint,
          currentParams,
          context
        );

        if ('data' in response && Array.isArray(response.data)) {
          allData.push(...response.data);
        }

        // Check for next page
        if (response.links?.next) {
          const nextLink = response.links.next as string;

          currentEndpoint = nextLink;
          currentParams = {}; // Reset params for subsequent requests
        } else {
          break;
        }
      }

      return allData;
    },
    { ...context, endpoint }
  );
}

// ===== Fetch-based implementation =====

async function fetchRequestSingle<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
>(
  client: PcoClientState,
  method: string,
  endpoint: string,
  data?: Partial<TRes['attributes']>,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<JsonApiResponse<TRes, TIncluded>> {
  const response = await makeFetchRequest<JsonApiResponse<TRes, TIncluded>>(
    client,
    method,
    endpoint,
    data,
    params,
    context
  );

  return response;
}

async function fetchRequestList<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
>(
  client: PcoClientState,
  method: string,
  endpoint: string,
  data?: Partial<TRes['attributes']>,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<Paginated<TRes, TIncluded>> {
  const response = await makeFetchRequest<Paginated<TRes, TIncluded>>(
    client,
    method,
    endpoint,
    data,
    params,
    context
  );

  return response;
}

async function makeFetchRequest<TDoc>(
  client: PcoClientState,
  method: string,
  endpoint: string,
  data?: Record<string, any>,
  params?: Record<string, string | number | boolean | undefined>,
  context?: Partial<ErrorContext>
): Promise<TDoc> {
  // Wait for rate limiter
  await client.rateLimiter.waitForAvailability();

  const baseURL =
    client.config.baseURL ?? 'https://api.planningcenteronline.com/people/v2';
  // Respect absolute endpoints returned by API links
  let url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

  // Add query parameters
  if (params) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();

    if (queryString) {
      // Append appropriately based on existing query
      url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...client.config.headers,
  };

  // Add authentication
  if (client.config.accessToken) {
    headers.Authorization = `Bearer ${client.config.accessToken}`;
  } else if (client.config.appId && client.config.appSecret) {
    // Use standard base64 encoding; prefer global btoa if available
    const toBase64 = (input: string): string => {
      if (typeof globalThis.btoa === 'function') {
        return globalThis.btoa(input);
      }

      // Fallback for Node environments
      return Buffer.from(input, 'utf-8').toString('base64');
    };

    const credentials = toBase64(
      `${client.config.appId}:${client.config.appSecret}`
    );

    headers.Authorization = `Basic ${credentials}`;
  }

  // Prepare request options
  const options: RequestInit = {
    headers,
    method,
  };

  // Add body for POST/PATCH requests
  if ((method === 'POST' || method === 'PATCH') && data) {
    const jsonApiData = { data: { attributes: data } };

    options.body = JSON.stringify(jsonApiData);
  }

  // Add timeout if configured
  const timeout = client.config.timeout;
  let timeoutId: NodeJS.Timeout | undefined;

  if (timeout) {
    const controller = new AbortController();

    timeoutId = setTimeout(() => controller.abort(), timeout);
    options.signal = controller.signal;
  }

  try {
    // Make the request
    const response = await fetch(url, options);

    // Clear timeout if it was set
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Update rate limiter from headers
    const rateLimitHeaders: RateLimitHeaders = {
      'Retry-After': response.headers.get('retry-after') ?? undefined,
      'X-PCO-API-Request-Rate-Count':
        response.headers.get('x-pco-api-request-rate-count') ?? undefined,
      'X-PCO-API-Request-Rate-Limit':
        response.headers.get('x-pco-api-request-rate-limit') ?? undefined,
      'X-PCO-API-Request-Rate-Period':
        response.headers.get('x-pco-api-request-rate-period') ?? undefined,
    };

    client.rateLimiter.updateFromHeaders(rateLimitHeaders);
    client.rateLimiter.recordRequest();

    // Handle 429 responses
    if (response.status === 429) {
      await client.rateLimiter.waitForAvailability();

      return makeFetchRequest<TDoc>(
        client,
        method,
        endpoint,
        data,
        params,
        context
      );
    }

    // Handle other errors
    if (!response.ok) {
      // Handle 401 errors with token refresh if available
      if (response.status === 401 && hasRefreshTokenCapability(client)) {
        try {
          // Attempt to refresh the token and retry the request
          return await attemptTokenRefresh(client, () =>
            makeFetchRequest<TDoc>(client, method, endpoint, data, params, context)
          );
        } catch (refreshError) {
          // If token refresh fails, fall through to normal error handling
          console.warn('Token refresh failed:', refreshError);
        }
      }

      let errorData: unknown;

      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      throw PcoError.fromFetchError(response, errorData, {
        ...context,
        endpoint,
        method,
      });
    }

    // Parse response
    if (method === 'DELETE') {
      return undefined as unknown as TDoc;
    }

    const responseData = (await response.json()) as TDoc;

    return responseData;
  } catch (error) {
    // Clear timeout if it was set
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Handle network errors
    if (error instanceof PcoError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw handleTimeoutError(
          `${method} ${endpoint}`,
          timeout ?? 30000,
          context
        );
      }
      throw handleNetworkError(error, `${method} ${endpoint}`, context);
    }

    throw handleNetworkError(
      new Error(String(error)),
      `${method} ${endpoint}`,
      context
    );
  }
}

// ===== Utility Functions =====

/**
 * Get rate limit information
 */
export function getRateLimitInfo(client: PcoClientState) {
  return client.rateLimiter.getRateLimitInfo();
}
