/**
 * People Contacts API Integration Tests
 * 
 * Tests for src/people/contacts.ts functions:
 * - getPersonEmails, createPersonEmail, getPersonPhoneNumbers, createPersonPhoneNumber,
 *   getPersonAddresses, createPersonAddress, updatePersonAddress,
 *   getPersonSocialProfiles, createPersonSocialProfile
 * 
 * To run: npm run test:integration:people-contacts
 */

import {
    createPcoClient,
    getPersonEmails,
    createPersonEmail,
    getPersonPhoneNumbers,
    createPersonPhoneNumber,
    getPersonAddresses,
    createPersonAddress,
    updatePersonAddress,
    getPersonSocialProfiles,
    createPersonSocialProfile,
    deleteSocialProfile,
    createPerson,
    deletePerson,
    type PcoClientState,
    type PersonAttributes,
    type EmailAttributes,
    type PhoneNumberAttributes,
    type AddressAttributes,
    type SocialProfileAttributes,
} from '../../src';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateBooleanAttribute,
    validateDateAttribute,
    validateRelationship,
} from '../type-validators';

// Test configuration
const TEST_PREFIX = 'TEST_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Contacts API Integration Tests', () => {
    let client: PcoClientState;
    let testPersonId = ''
    let testEmailId: string | null = null;
    let testPhoneId: string | null = null;
    let testAddressId = ''
    let testSocialProfileId: string | null = null;

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

        // Create test person for contacts
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_Contact_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const personResponse = await createPerson(client, personData);
        testPersonId = personResponse.data?.id || '';
    }, 30000);

    afterAll(async () => {
        // Clean up test person (this will cascade delete all contacts)
        if (testPersonId) {
            try {
                await deletePerson(client, testPersonId);
                testPersonId = '';
            } catch (error) {
                // Ignore cleanup errors
                console.warn('Failed to clean up test person:', error);
            }
        }
    }, 30000);

    describe('Email Management', () => {
        it('should create and get person emails', async () => {
            const timestamp = Date.now();
            const emailData: Partial<EmailAttributes> = {
                address: `test${timestamp}@planningcenteronline.com`,
                location: 'home',
                primary: false,
            };

            // Create email
            const createResponse = await createPersonEmail(client, testPersonId, emailData);
            expect(createResponse.data).toBeDefined();

            // Validate EmailResource structure
            validateResourceStructure(createResponse.data, 'Email');
            expect(createResponse.data?.attributes?.address).toBe(emailData.address);

            // Validate EmailAttributes

            validateStringAttribute(createResponse.data?.attributes, 'address');
            validateStringAttribute(createResponse.data?.attributes, 'location');
            validateBooleanAttribute(createResponse.data?.attributes, 'primary');
            validateBooleanAttribute(createResponse.data?.attributes, 'blocked');
            validateDateAttribute(createResponse.data?.attributes, 'created_at');
            validateDateAttribute(createResponse.data?.attributes, 'updated_at');


            // Validate EmailRelationships
            validateRelationship(createResponse.data?.relationships?.person,);



            testEmailId = createResponse.data?.id || null;

            // Get person emails
            const emailsResponse = await getPersonEmails(client, testPersonId);
            expect(Array.isArray(emailsResponse.data)).toBe(true);
            expect(emailsResponse.data.length).toBeGreaterThan(0);

            const createdEmail = emailsResponse.data.find(
                (email) => email.attributes?.address === emailData.address,
            );
            expect(createdEmail).toBeDefined();

            // Validate Email list response

            validateResourceStructure(createdEmail, 'Email');

        }, 30000);
    });

    describe('Phone Number Management', () => {
        it('should create and get person phone numbers', async () => {
            const timestamp = Date.now();
            const phoneData: Partial<PhoneNumberAttributes> = {
                number: `+1-555-${timestamp.toString().slice(-7)}`,
                location: 'mobile',
                primary: false,
            };

            // Create phone number
            const createResponse = await createPersonPhoneNumber(client, testPersonId, phoneData);
            expect(createResponse.data).toBeDefined();

            // Validate PhoneNumberResource structure
            validateResourceStructure(createResponse.data, 'PhoneNumber');
            expect(createResponse.data?.attributes?.number).toBe(phoneData.number);

            // Validate PhoneNumberAttributes
            validateStringAttribute(createResponse.data?.attributes, 'number');
            validateStringAttribute(createResponse.data?.attributes, 'location');
            validateBooleanAttribute(createResponse.data?.attributes, 'primary');
            validateDateAttribute(createResponse.data?.attributes, 'created_at');
            validateDateAttribute(createResponse.data?.attributes, 'updated_at');


            // Validate PhoneNumberRelationships
            validateRelationship(createResponse.data?.relationships?.person);



            testPhoneId = createResponse.data?.id || null;

            // Get person phone numbers
            const phonesResponse = await getPersonPhoneNumbers(client, testPersonId);
            expect(Array.isArray(phonesResponse.data)).toBe(true);
            expect(phonesResponse.data.length).toBeGreaterThan(0);

            const createdPhone = phonesResponse.data.find(
                (phone) => phone.attributes?.number === phoneData.number
            );
            expect(createdPhone).toBeDefined();

            // Validate PhoneNumber list response

            validateResourceStructure(createdPhone, 'PhoneNumber');

        }, 30000);
    });

    describe('Address Management', () => {
        it('should create, get, and update person addresses', async () => {
            const timestamp = Date.now();
            const addressData: Partial<AddressAttributes> = {
                street: `${timestamp} Test Street`,
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                location: 'home',
                primary: false,
            };

            // Create address
            const createResponse = await createPersonAddress(client, testPersonId, addressData);
            expect(createResponse.data).toBeDefined();

            // Validate AddressResource structure
            validateResourceStructure(createResponse.data, 'Address');
            expect(createResponse.data?.attributes?.street).toBe(addressData.street);

            // Validate AddressAttributes
            validateStringAttribute(createResponse.data?.attributes, 'street');
            validateStringAttribute(createResponse.data?.attributes, 'city');
            validateStringAttribute(createResponse.data?.attributes, 'state');
            validateStringAttribute(createResponse.data?.attributes, 'zip');
            validateStringAttribute(createResponse.data?.attributes, 'location');
            validateBooleanAttribute(createResponse.data?.attributes, 'primary');
            validateDateAttribute(createResponse.data?.attributes, 'created_at');
            validateDateAttribute(createResponse.data?.attributes, 'updated_at');


            // Validate AddressRelationships

            validateRelationship(createResponse.data?.relationships?.person);



            testAddressId = createResponse.data?.id || '';

            // Get person addresses
            const addressesResponse = await getPersonAddresses(client, testPersonId);
            expect(Array.isArray(addressesResponse.data)).toBe(true);
            expect(addressesResponse.data.length).toBeGreaterThan(0);

            const createdAddress = addressesResponse.data.find(
                (address) => address.attributes?.street === addressData.street
            );
            expect(createdAddress).toBeDefined();

            // Update address

            const updateData: Partial<AddressAttributes> = {
                city: 'Updated City',
                state: 'UC',
            };

            const updateResponse = await updatePersonAddress(client, testPersonId, testAddressId, updateData);
            expect(updateResponse.data?.attributes?.city).toBe(updateData.city);
            expect(updateResponse.data?.attributes?.state).toBe(updateData.state);
            expect(updateResponse.data?.attributes?.address1).toBe(addressData.address1); // Should remain unchanged

        }, 30000);
    });

    describe('Social Profile Management', () => {
        it('should create and validate social profile types', async () => {
            const timestamp = Date.now();
            const socialProfileData: Partial<SocialProfileAttributes> = {
                site: 'Facebook',
                url: `https://facebook.com/testuser${timestamp}`,
                verified: false,
            };


            const createResponse = await createPersonSocialProfile(client, testPersonId, socialProfileData);
            expect(createResponse.data).toBeDefined();

            // Validate SocialProfileResource structure
            validateResourceStructure(createResponse.data, 'SocialProfile');

            // Validate SocialProfileAttributes
            validateStringAttribute(createResponse.data?.attributes, 'site');
            validateStringAttribute(createResponse.data?.attributes, 'url');
            validateBooleanAttribute(createResponse.data?.attributes, 'verified');
            validateDateAttribute(createResponse.data?.attributes, 'created_at');
            validateDateAttribute(createResponse.data?.attributes, 'updated_at');

            // Validate SocialProfileRelationships (should not exist according to API docs)
            expect(createResponse.data?.relationships).toBeUndefined();

            // Clean up
            await deleteSocialProfile(client, createResponse.data?.id || '');


        }, 30000);
    });
});
