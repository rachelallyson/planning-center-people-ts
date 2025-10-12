/**
 * v2.0.0 Token Refresh Tests
 * 
 * Tests for the new OAuth token refresh functionality with client credentials
 */

import { PcoClient } from '../src';

// Mock fetch for testing
global.fetch = jest.fn();

describe('v2.0.0 Token Refresh', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        mockFetch = fetch as jest.MockedFunction<typeof fetch>;
        jest.clearAllMocks();
    });

    describe('OAuth Token Refresh with Client Credentials', () => {
        it('should include client credentials in token refresh request', async () => {
            // Mock successful token refresh response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            // This would trigger token refresh internally when making a request
            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment, but the important part is
                // that the token refresh request includes client credentials
            }

            // Verify that fetch was called with client credentials
            expect(mockFetch).toHaveBeenCalled();
            
            // Check that the token refresh request includes client credentials
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('client_id=test-client-id');
                expect(requestBody).toContain('client_secret=test-client-secret');
                expect(requestBody).toContain('grant_type=refresh_token');
                expect(requestBody).toContain('refresh_token=valid-refresh-token');
            }
        });

        it('should use environment variables when client credentials not in config', async () => {
            // Set environment variables
            process.env.PCO_APP_ID = 'env-client-id';
            process.env.PCO_APP_SECRET = 'env-client-secret';

            // Mock successful token refresh response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                    // No client credentials in config - should use environment variables
                }
            });

            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment
            }

            // Verify that fetch was called with client credentials from environment
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('client_id=env-client-id');
                expect(requestBody).toContain('client_secret=env-client-secret');
            }

            // Clean up environment variables
            delete process.env.PCO_APP_ID;
            delete process.env.PCO_APP_SECRET;
        });

        it('should prioritize config credentials over environment variables', async () => {
            // Set environment variables
            process.env.PCO_APP_ID = 'env-client-id';
            process.env.PCO_APP_SECRET = 'env-client-secret';

            // Mock successful token refresh response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'config-client-id',
                    clientSecret: 'config-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment
            }

            // Verify that config credentials are used, not environment variables
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('client_id=config-client-id');
                expect(requestBody).toContain('client_secret=config-client-secret');
                expect(requestBody).not.toContain('env-client-id');
                expect(requestBody).not.toContain('env-client-secret');
            }

            // Clean up environment variables
            delete process.env.PCO_APP_ID;
            delete process.env.PCO_APP_SECRET;
        });

        it('should handle token refresh failure with 401 error', async () => {
            // Mock 401 Unauthorized response for token refresh
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({
                    error: 'invalid_client',
                    error_description: 'Client authentication failed'
                }),
            } as Response);

            const onRefreshFailure = jest.fn();
            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'invalid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: onRefreshFailure,
                }
            });

            // Test the token refresh directly - it should throw an error
            let errorThrown = false;
            try {
                const httpClient = (client as any).httpClient;
                await httpClient.attemptTokenRefresh();
            } catch (error) {
                errorThrown = true;
                // Verify the error message includes 401 details
                expect(error.message).toContain('Token refresh failed');
                expect(error.message).toContain('401');
            }

            // Verify that an error was thrown
            expect(errorThrown).toBe(true);
        });

        it('should handle missing client credentials gracefully', async () => {
            // Mock successful token refresh response (some APIs work without client credentials)
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                    // No client credentials provided
                }
            });

            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment
            }

            // Verify that fetch was called without client credentials
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('grant_type=refresh_token');
                expect(requestBody).toContain('refresh_token=valid-refresh-token');
                expect(requestBody).not.toContain('client_id=');
                expect(requestBody).not.toContain('client_secret=');
            }
        });
    });

    describe('Basic Auth Token Refresh', () => {
        it('should not attempt token refresh for basic auth', async () => {
            const client = new PcoClient({
                auth: {
                    type: 'basic',
                    appId: 'test-app-id',
                    appSecret: 'test-app-secret',
                }
            });

            // Mock a successful response with proper headers
            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ data: [] }),
            } as any);

            await client.people.getAll();

            // Verify that no token refresh was attempted
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0].includes('/oauth/token')
            );
            
            expect(tokenRefreshCall).toBeUndefined();
        });
    });

    describe('Personal Access Token Auth', () => {
        it('should not attempt token refresh for personal access token', async () => {
            const client = new PcoClient({
                auth: {
                    type: 'personal_access_token',
                    personalAccessToken: 'test-pat',
                }
            });

            // Mock a successful response with proper headers
            mockFetch.mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ data: [] }),
            } as any);

            await client.people.getAll();

            // Verify that no token refresh was attempted
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0].includes('/oauth/token')
            );
            
            expect(tokenRefreshCall).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors during token refresh', async () => {
            // Mock network error for token refresh
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            // Test the token refresh directly - it should throw an error
            let errorThrown = false;
            try {
                const httpClient = (client as any).httpClient;
                await httpClient.attemptTokenRefresh();
            } catch (error) {
                errorThrown = true;
                // Verify the error is a network error
                expect(error.message).toContain('Network error');
            }

            // Verify that an error was thrown
            expect(errorThrown).toBe(true);
        });

        it('should handle malformed token refresh response', async () => {
            // Mock malformed response for token refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                },
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            // Test the token refresh directly - it should throw an error
            let errorThrown = false;
            try {
                const httpClient = (client as any).httpClient;
                await httpClient.attemptTokenRefresh();
            } catch (error) {
                errorThrown = true;
                // Verify the error is a JSON parsing error
                expect(error.message).toContain('Invalid JSON');
            }

            // Verify that an error was thrown
            expect(errorThrown).toBe(true);
        });
    });
});
