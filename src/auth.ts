import type { PcoClientState } from './core';

// OAuth token response from PCO
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// Token refresh callback type
export type TokenRefreshCallback = (newTokens: TokenResponse) => void | Promise<void>;

// Token refresh failure callback type
export type TokenRefreshFailureCallback = (error: Error, context: {
  originalError?: Error;
  refreshToken?: string;
  attemptCount?: number;
}) => void | Promise<void>;

// Enhanced client config with refresh token support
export interface PcoClientConfigWithRefresh {
  /** Personal Access Token (for single-user apps) */
  personalAccessToken?: string;
  /** OAuth 2.0 Access Token (for multi-user apps) */
  accessToken?: string;
  /** OAuth 2.0 Refresh Token (for multi-user apps) */
  refreshToken?: string;
  /** App ID (for Personal Access Token auth) */
  appId?: string;
  /** App Secret (for Personal Access Token auth) */
  appSecret?: string;
  /** Callback to handle token refresh */
  onTokenRefresh?: TokenRefreshCallback;
  /** Callback to handle token refresh failures */
  onTokenRefreshFailure?: TokenRefreshFailureCallback;
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
    onRetry?: (error: any, attempt: number) => void;
  };
}

/**
 * Refresh an OAuth access token using the refresh token
 */
export async function refreshAccessToken(
  client: PcoClientState,
  refreshToken: string
): Promise<TokenResponse> {
  const baseURL = client.config.baseURL ?? 'https://api.planningcenteronline.com';
  const tokenUrl = `${baseURL}/oauth/token`;

  // Prepare the request body for token refresh
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  // Add client credentials if available
  if (client.config.appId && client.config.appSecret) {
    body.append('client_id', client.config.appId);
    body.append('client_secret', client.config.appSecret);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Token refresh failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
    );
  }

  const tokenData = await response.json() as TokenResponse;
  return tokenData;
}

/**
 * Update client configuration with new tokens
 */
export function updateClientTokens(
  client: PcoClientState,
  newTokens: TokenResponse
): void {
  // Update the client's access token
  client.config.accessToken = newTokens.access_token;

  // Update refresh token if provided
  if (newTokens.refresh_token) {
    client.config.refreshToken = newTokens.refresh_token;
  }
}

/**
 * Check if a client has refresh token capability
 */
export function hasRefreshTokenCapability(client: PcoClientState): boolean {
  return !!(client.config.refreshToken && (client.config.onTokenRefresh || client.config.onTokenRefreshFailure));
}

/**
 * Attempt to refresh tokens and retry the original request
 */
export async function attemptTokenRefresh<T>(
  client: PcoClientState,
  originalRequest: () => Promise<T>
): Promise<T> {
  if (!hasRefreshTokenCapability(client)) {
    throw new Error('No refresh token or callback configured');
  }

  try {
    // Attempt to refresh the token
    const newTokens = await refreshAccessToken(client, client.config.refreshToken!);

    // Update the client with new tokens
    updateClientTokens(client, newTokens);

    // Call the token refresh callback if provided
    if (client.config.onTokenRefresh) {
      try {
        await client.config.onTokenRefresh(newTokens);
      } catch (callbackError) {
        // Log callback error but don't fail the token refresh
        console.warn('Token refresh callback failed:', callbackError);
      }
    }

    // Retry the original request with the new token
    return await originalRequest();

  } catch (error) {
    const refreshError = new Error(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);

    // Call the failure callback if provided
    if (client.config.onTokenRefreshFailure) {
      try {
        await client.config.onTokenRefreshFailure(refreshError, {
          originalError: error instanceof Error ? error : undefined,
          refreshToken: client.config.refreshToken,
          attemptCount: 1, // Could be enhanced to track retry attempts
        });
      } catch (callbackError) {
        // Log callback error but don't fail the refresh error
        console.warn('Token refresh failure callback failed:', callbackError);
      }
    }

    throw refreshError;
  }
}
