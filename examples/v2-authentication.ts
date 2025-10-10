/**
 * v2.0.0 Authentication Examples
 * 
 * This file demonstrates how to use both OAuth and Personal Access Token authentication
 * with the Planning Center People API v2.0 client.
 */

import { PcoClient, type PcoClientConfig } from '../src';

// ===== Personal Access Token Authentication =====

/**
 * Example: Using Personal Access Token
 * 
 * Personal Access Tokens are simpler to set up and don't require OAuth flow.
 * They're perfect for server-to-server applications and testing.
 */
export function createClientWithPersonalAccessToken(token: string): PcoClient {
    const config: PcoClientConfig = {
        auth: {
            type: 'personal_access_token',
            personalAccessToken: token,
        },
    };

    return new PcoClient(config);
}

// ===== OAuth Authentication =====

/**
 * Example: Using OAuth Access Token
 * 
 * OAuth tokens are obtained through the OAuth flow and can be refreshed.
 * They're ideal for applications that need to act on behalf of users.
 */
export function createClientWithOAuthToken(accessToken: string, refreshToken?: string): PcoClient {
    const config: PcoClientConfig = {
        auth: {
            type: 'oauth',
            accessToken,
            refreshToken,
            onRefresh: async (tokens) => {
                console.log('Token refreshed:', tokens.accessToken);
                // Store the new tokens in your secure storage
                // await storeTokens(tokens.accessToken, tokens.refreshToken);
            },
            onRefreshFailure: (error) => {
                console.error('Token refresh failed:', error);
                // Handle refresh failure (redirect to login, etc.)
            },
        },
    };

    return new PcoClient(config);
}

// ===== Environment-based Configuration =====

/**
 * Example: Smart authentication based on environment variables
 * 
 * This approach automatically detects which authentication method to use
 * based on available environment variables.
 */
export function createClientFromEnvironment(): PcoClient {
    const hasPersonalAccessToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;
    const hasOAuthToken = !!process.env.PCO_ACCESS_TOKEN;

    if (!hasPersonalAccessToken && !hasOAuthToken) {
        throw new Error('Either PCO_PERSONAL_ACCESS_TOKEN or PCO_ACCESS_TOKEN must be set');
    }

    const config: PcoClientConfig = hasPersonalAccessToken ? {
        auth: {
            type: 'personal_access_token',
            personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
        },
    } : {
        auth: {
            type: 'oauth',
            accessToken: process.env.PCO_ACCESS_TOKEN!,
            refreshToken: process.env.PCO_REFRESH_TOKEN,
        },
    };

    return new PcoClient(config);
}

// ===== Usage Examples =====

async function demonstrateUsage() {
    try {
        // Create client (will use Personal Access Token if available, otherwise OAuth)
        const client = createClientFromEnvironment();

        // Test the connection
        const people = await client.people.getAll({ perPage: 1 });
        console.log('Successfully connected to PCO API!');
        console.log(`Found ${people.data.length} people`);

        // Example: Create a person
        const newPerson = await client.people.create({
            first_name: 'Test',
            last_name: 'User',
            status: 'active',
        });
        console.log('Created person:', newPerson.id);

        // Example: Add an email to the person
        const email = await client.people.addEmail(newPerson.id, {
            address: 'test@example.com',
            location: 'Home',
            primary: true,
        });
        console.log('Added email:', email.id);

        // Clean up
        await client.people.delete(newPerson.id);
        console.log('Cleaned up test person');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run the example
// demonstrateUsage();

export {
    createClientWithPersonalAccessToken,
    createClientWithOAuthToken,
    createClientFromEnvironment,
};
