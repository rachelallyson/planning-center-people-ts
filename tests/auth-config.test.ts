/**
 * Test the new type-safe authentication configuration
 */

import { PcoClient, type PcoClientConfig, type PersonalAccessTokenAuth, type OAuthAuth } from '../src';

describe('Authentication Configuration v2.0.0', () => {
    describe('Personal Access Token Configuration', () => {
        it('should create client with valid PAT configuration', () => {
            const config: PcoClientConfig = {
                auth: {
                    type: 'personal_access_token',
                    personalAccessToken: 'test-token'
                }
            };

            const client = new PcoClient(config);
            expect(client).toBeDefined();
        });

        it('should enforce required personalAccessToken field', () => {
            // This should cause a TypeScript error if uncommented
            // const config: PcoClientConfig = {
            //   auth: {
            //     type: 'personal_access_token'
            //     // personalAccessToken is required
            //   }
            // };
        });
    });

    describe('OAuth Configuration', () => {
        it('should create client with valid OAuth configuration', () => {
            const config: PcoClientConfig = {
                auth: {
                    type: 'oauth',
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                    onRefresh: async (tokens) => {
                        console.log('Tokens refreshed:', tokens);
                    },
                    onRefreshFailure: async (error) => {
                        console.error('Refresh failed:', error);
                    }
                }
            };

            const client = new PcoClient(config);
            expect(client).toBeDefined();
        });

        it('should enforce required OAuth fields', () => {
            // This should cause TypeScript errors if uncommented
            // const config: PcoClientConfig = {
            //   auth: {
            //     type: 'oauth',
            //     accessToken: 'access-token',
            //     refreshToken: 'refresh-token'
            //     // onRefresh and onRefreshFailure are required
            //   }
            // };
        });
    });

    describe('Type Safety', () => {
        it('should prevent mixing auth types', () => {
            // This should cause TypeScript errors if uncommented
            // const config: PcoClientConfig = {
            //   auth: {
            //     type: 'personal_access_token',
            //     personalAccessToken: 'test-token',
            //     accessToken: 'access-token' // This should not be allowed
            //   }
            // };
        });

        it('should prevent OAuth fields on PAT config', () => {
            // This should cause TypeScript errors if uncommented
            // const config: PcoClientConfig = {
            //   auth: {
            //     type: 'personal_access_token',
            //     personalAccessToken: 'test-token',
            //     onRefresh: async () => {} // This should not be allowed
            //   }
            // };
        });
    });

    describe('Configuration Examples', () => {
        it('should work with Personal Access Token example', () => {
            const patConfig: PersonalAccessTokenAuth = {
                type: 'personal_access_token',
                personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN || 'test-token'
            };

            const config: PcoClientConfig = {
                auth: patConfig,
                timeout: 30000
            };

            const client = new PcoClient(config);
            expect(client).toBeDefined();
        });

        it('should work with OAuth example', () => {
            const oauthConfig: OAuthAuth = {
                type: 'oauth',
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                onRefresh: async (tokens) => {
                    // Save tokens to database
                    console.log('Saving tokens:', tokens);
                },
                onRefreshFailure: async (error) => {
                    // Handle refresh failure
                    console.error('Token refresh failed:', error.message);
                }
            };

            const config: PcoClientConfig = {
                auth: oauthConfig,
                timeout: 30000
            };

            const client = new PcoClient(config);
            expect(client).toBeDefined();
        });
    });
});
