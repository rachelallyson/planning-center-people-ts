import {
  attemptTokenRefresh,
  hasRefreshTokenCapability,
  refreshAccessToken,
  updateClientTokens,
  type TokenResponse,
} from '../src/auth';
import { createPcoClient } from '../src/core';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Authentication Utilities', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  describe('hasRefreshTokenCapability', () => {
    it('should return true when both refresh token and callback are present', () => {
      const client = createPcoClient({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        onTokenRefresh: jest.fn(),
      });

      expect(hasRefreshTokenCapability(client)).toBe(true);
    });

    it('should return false when refresh token is missing', () => {
      const client = createPcoClient({
        accessToken: 'access-token',
        onTokenRefresh: jest.fn(),
      });

      expect(hasRefreshTokenCapability(client)).toBe(false);
    });

    it('should return false when callback is missing', () => {
      const client = createPcoClient({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(hasRefreshTokenCapability(client)).toBe(false);
    });

    it('should return false when both are missing', () => {
      const client = createPcoClient({
        accessToken: 'access-token',
      });

      expect(hasRefreshTokenCapability(client)).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const client = createPcoClient({
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      });

      const result = await refreshAccessToken(client, 'old-refresh-token');

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/oauth/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: 'grant_type=refresh_token&refresh_token=old-refresh-token&client_id=test-app-id&client_secret=test-app-secret',
        }
      );
    });

    it('should refresh token without client credentials', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const client = createPcoClient({});

      const result = await refreshAccessToken(client, 'old-refresh-token');

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/oauth/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: 'grant_type=refresh_token&refresh_token=old-refresh-token',
        }
      );
    });

    it('should handle refresh token failure', async () => {
      const mockErrorResponse = {
        error: 'invalid_grant',
        error_description: 'The refresh token is invalid',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockErrorResponse,
      } as Response);

      const client = createPcoClient({
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      });

      await expect(refreshAccessToken(client, 'invalid-refresh-token')).rejects.toThrow(
        'Token refresh failed: 400 Bad Request. {"error":"invalid_grant","error_description":"The refresh token is invalid"}'
      );
    });

    it('should handle network errors during refresh', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = createPcoClient({
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      });

      await expect(refreshAccessToken(client, 'refresh-token')).rejects.toThrow('Network error');
    });
  });

  describe('updateClientTokens', () => {
    it('should update client with new tokens', () => {
      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      });

      const newTokens: TokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      updateClientTokens(client, newTokens);

      expect(client.config.accessToken).toBe('new-access-token');
      expect(client.config.refreshToken).toBe('new-refresh-token');
    });

    it('should update access token even if refresh token is not provided', () => {
      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      });

      const newTokens: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      updateClientTokens(client, newTokens);

      expect(client.config.accessToken).toBe('new-access-token');
      expect(client.config.refreshToken).toBe('old-refresh-token'); // Should remain unchanged
    });
  });

  describe('attemptTokenRefresh', () => {
    it('should successfully refresh token and retry request', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const mockCallback = jest.fn();
      const mockOriginalRequest = jest.fn().mockResolvedValue('success');

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        onTokenRefresh: mockCallback,
      });

      const result = await attemptTokenRefresh(client, mockOriginalRequest);

      expect(result).toBe('success');
      expect(mockOriginalRequest).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(mockTokenResponse);
      expect(client.config.accessToken).toBe('new-access-token');
      expect(client.config.refreshToken).toBe('new-refresh-token');
    });

    it('should throw error when no refresh token capability', async () => {
      const client = createPcoClient({
        accessToken: 'access-token',
        // Missing refreshToken and onTokenRefresh
      });

      const mockOriginalRequest = jest.fn();

      await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow(
        'No refresh token or callback configured'
      );
    });

    it('should throw error when token refresh fails', async () => {
      const mockCallback = jest.fn();
      const mockOriginalRequest = jest.fn();

      // Mock failed token refresh
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      } as Response);

      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'invalid-refresh-token',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        onTokenRefresh: mockCallback,
      });

      await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow(
        'Token refresh failed:'
      );
    });

    it('should handle callback errors gracefully', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const mockCallback = jest.fn().mockRejectedValue(new Error('Callback error'));
      const mockOriginalRequest = jest.fn().mockResolvedValue('success');

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        onTokenRefresh: mockCallback,
      });

      // Should still succeed even if callback fails
      const result = await attemptTokenRefresh(client, mockOriginalRequest);

      expect(result).toBe('success');
      expect(mockOriginalRequest).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(mockTokenResponse);
    });

    it('should call failure callback when refresh fails', async () => {
      const mockFailureCallback = jest.fn();
      const mockOriginalRequest = jest.fn().mockResolvedValue('success');

      // Mock failed token refresh
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      } as Response);

      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'invalid-refresh-token',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        onTokenRefreshFailure: mockFailureCallback,
      });

      await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow('Token refresh failed');

      // Failure callback should have been called
      expect(mockFailureCallback).toHaveBeenCalledTimes(1);
      expect(mockFailureCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Token refresh failed'),
        }),
        expect.objectContaining({
          originalError: expect.any(Error),
          refreshToken: 'invalid-refresh-token',
          attemptCount: 1,
        })
      );

      // Original request should not have been called
      expect(mockOriginalRequest).not.toHaveBeenCalled();
    });

    it('should handle failure callback errors gracefully', async () => {
      const mockFailureCallback = jest.fn().mockRejectedValue(new Error('Failure callback error'));
      const mockOriginalRequest = jest.fn().mockResolvedValue('success');

      // Mock failed token refresh
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      } as Response);

      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'invalid-refresh-token',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        onTokenRefreshFailure: mockFailureCallback,
      });

      // Should still throw the refresh error even if failure callback fails
      await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow('Token refresh failed');

      // Failure callback should have been called
      expect(mockFailureCallback).toHaveBeenCalledTimes(1);
    });

    it('should not call failure callback when refresh succeeds', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const mockFailureCallback = jest.fn();
      const mockOriginalRequest = jest.fn().mockResolvedValue('success');

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const client = createPcoClient({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
        onTokenRefreshFailure: mockFailureCallback,
      });

      const result = await attemptTokenRefresh(client, mockOriginalRequest);

      expect(result).toBe('success');
      // Failure callback should not have been called
      expect(mockFailureCallback).not.toHaveBeenCalled();
    });
  });
});
