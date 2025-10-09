import { createPcoClient, attemptTokenRefresh } from '../src';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Refresh Token Fallback Behavior', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        mockFetch = fetch as jest.MockedFunction<typeof fetch>;
        jest.clearAllMocks();
    });

    describe('When refresh token fails', () => {
        it('should throw error when refresh token is invalid', async () => {
            const client = createPcoClient({
                accessToken: 'expired-access-token',
                refreshToken: 'invalid-refresh-token',
                appId: 'test-app-id',
                appSecret: 'test-app-secret',
                onTokenRefresh: jest.fn(),
            });

            // Mock the refresh token call failing
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({
                    error: 'invalid_grant',
                    error_description: 'The refresh token is invalid'
                }),
            } as Response);

            const mockOriginalRequest = jest.fn().mockResolvedValue('success');

            await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow('Token refresh failed');

            // Should have made 1 call: refresh token call
            expect(mockFetch).toHaveBeenCalledTimes(1);
            // Original request should not have been called since refresh failed
            expect(mockOriginalRequest).not.toHaveBeenCalled();
        });

        it('should throw error when refresh token network fails', async () => {
            const client = createPcoClient({
                accessToken: 'expired-access-token',
                refreshToken: 'valid-refresh-token',
                appId: 'test-app-id',
                appSecret: 'test-app-secret',
                onTokenRefresh: jest.fn(),
            });

            // Mock network failure during refresh
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const mockOriginalRequest = jest.fn().mockResolvedValue('success');

            await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow('Token refresh failed');

            // Should have made 1 call: refresh token call
            expect(mockFetch).toHaveBeenCalledTimes(1);
            // Original request should not have been called since refresh failed
            expect(mockOriginalRequest).not.toHaveBeenCalled();
        });

        it('should throw error when no refresh token capability', async () => {
            const client = createPcoClient({
                accessToken: 'expired-access-token',
                // No refreshToken or onTokenRefresh
            });

            const mockOriginalRequest = jest.fn().mockResolvedValue('success');

            await expect(attemptTokenRefresh(client, mockOriginalRequest)).rejects.toThrow('No refresh token or callback configured');

            // Should not have made any fetch calls
            expect(mockFetch).toHaveBeenCalledTimes(0);
            // Original request should not have been called
            expect(mockOriginalRequest).not.toHaveBeenCalled();
        });

        it('should succeed when refresh token works', async () => {
            const client = createPcoClient({
                accessToken: 'expired-access-token',
                refreshToken: 'valid-refresh-token',
                appId: 'test-app-id',
                appSecret: 'test-app-secret',
                onTokenRefresh: jest.fn(),
            });

            // Mock successful token refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const mockOriginalRequest = jest.fn().mockResolvedValue('success');

            const result = await attemptTokenRefresh(client, mockOriginalRequest);

            expect(result).toBe('success');
            // Should have made 1 call: refresh token call
            expect(mockFetch).toHaveBeenCalledTimes(1);
            // Original request should have been called after successful refresh
            expect(mockOriginalRequest).toHaveBeenCalledTimes(1);
        });

        it('should handle callback failure gracefully', async () => {
            const mockCallback = jest.fn().mockRejectedValue(new Error('Callback error'));
            const client = createPcoClient({
                accessToken: 'expired-access-token',
                refreshToken: 'valid-refresh-token',
                appId: 'test-app-id',
                appSecret: 'test-app-secret',
                onTokenRefresh: mockCallback,
            });

            // Mock successful token refresh
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const mockOriginalRequest = jest.fn().mockResolvedValue('success');

            const result = await attemptTokenRefresh(client, mockOriginalRequest);

            expect(result).toBe('success');
            // Should have made 1 call: refresh token call
            expect(mockFetch).toHaveBeenCalledTimes(1);
            // Original request should have been called despite callback failure
            expect(mockOriginalRequest).toHaveBeenCalledTimes(1);
            // Callback should have been called
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error message propagation', () => {
        it('should include original error details in refresh failure message', async () => {
            const client = createPcoClient({
                accessToken: 'expired-access-token',
                refreshToken: 'invalid-refresh-token',
                appId: 'test-app-id',
                appSecret: 'test-app-secret',
                onTokenRefresh: jest.fn(),
            });

            // Mock the refresh token call failing with specific error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({
                    error: 'invalid_grant',
                    error_description: 'The refresh token is invalid'
                }),
            } as Response);

            const mockOriginalRequest = jest.fn().mockResolvedValue('success');

            try {
                await attemptTokenRefresh(client, mockOriginalRequest);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Token refresh failed');
                expect(error.message).toContain('invalid_grant');
            }
        });
    });
});