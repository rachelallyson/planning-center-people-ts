/**
 * People Organization API Integration Tests
 * 
 * Tests for src/people/organization.ts functions:
 * - getOrganization
 * 
 * To run: npm run test:integration:people-organization
 */

import {
    createPcoClient,
    getOrganization,
    type PcoClientState,
} from '../../src';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateDateAttribute,
} from '../type-validators';

// Test configuration
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Organization API Integration Tests', () => {
    let client: PcoClientState;

    beforeAll(async () => {
        // Validate environment variables
        const hasAppCredentials = process.env.PCO_APP_ID && process.env.PCO_APP_SECRET;
        const hasOAuthCredentials = process.env.PCO_ACCESS_TOKEN;

        if (!hasAppCredentials && !hasOAuthCredentials) {
            throw new Error(
                'PCO credentials not found. Please set PCO_APP_ID and PCO_APP_SECRET, or PCO_ACCESS_TOKEN in .env.test'
            );
        }

        // Create client with rate limiting
        const config = hasOAuthCredentials
            ? {
                accessToken: process.env.PCO_ACCESS_TOKEN!,
                rateLimit: {
                    maxRequests: RATE_LIMIT_MAX,
                    perMilliseconds: RATE_LIMIT_WINDOW,
                },
                timeout: 30000,
            }
            : {
                appId: process.env.PCO_APP_ID!,
                appSecret: process.env.PCO_APP_SECRET!,
                rateLimit: {
                    maxRequests: RATE_LIMIT_MAX,
                    perMilliseconds: RATE_LIMIT_WINDOW,
                },
                timeout: 30000,
            };

        client = createPcoClient(config);
    }, 30000);

    describe('Organization Information', () => {
        it('should get organization info', async () => {
            const response = await getOrganization(client);

            expect(response).toHaveProperty('data');
            expect(response.data).toBeDefined();
            expect(response.data?.type).toBe('Organization');

            // Validate OrganizationResource structure
            validateResourceStructure(response.data, 'Organization');

            // Validate OrganizationAttributes
            validateStringAttribute(response.data?.attributes, 'name');
            validateStringAttribute(response.data?.attributes, 'avatar_url');
            validateStringAttribute(response.data?.attributes, 'church_center_subdomain');
            validateStringAttribute(response.data?.attributes, 'contact_website');
            validateStringAttribute(response.data?.attributes, 'country_code');
            validateStringAttribute(response.data?.attributes, 'date_format');
            validateStringAttribute(response.data?.attributes, 'time_zone');
        }, 30000);

        it('should validate organization structure', async () => {
            const response = await getOrganization(client);

            const organization = response.data;

            // Validate OrganizationResource structure
            validateResourceStructure(organization, 'Organization');

            // Validate OrganizationAttributes
            validateStringAttribute(organization?.attributes, 'avatar_url');
            validateStringAttribute(organization?.attributes, 'church_center_subdomain');
            validateStringAttribute(organization?.attributes, 'contact_website');
            validateStringAttribute(organization?.attributes, 'country_code');
            validateDateAttribute(organization?.attributes, 'created_at');
            validateStringAttribute(organization?.attributes, 'date_format');
            validateStringAttribute(organization?.attributes, 'name');
            validateStringAttribute(organization?.attributes, 'time_zone');
        }, 30000);

        it('should get organization with included resources', async () => {

            const response = await getOrganization(client, { include: ['people', 'households'] });

            expect(response).toHaveProperty('data');
            expect(response.data).toBeDefined();
            expect(response.data?.type).toBe('Organization');

            // Check if included resources are present
            const people = response.included?.filter(r => r.type === 'Person');
            const households = response.included?.filter(r => r.type === 'Household');

            people?.forEach(person => {
                validateResourceStructure(person, 'Person');
            });

            households?.forEach(household => {
                validateResourceStructure(household, 'Household');
            })


        }, 30000);
    });
});
