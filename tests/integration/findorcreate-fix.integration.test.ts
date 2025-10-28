/**
 * Integration test for findOrCreate functionality
 * This test demonstrates the fix with real API calls when credentials are available
 */

import { PcoClient } from '../src';
import { createTestClient, logAuthStatus } from './test-config';

const TEST_PREFIX = 'TEST_FINDORCREATE_FIX_2025';

describe('findOrCreate Integration Test', () => {
    let client: PcoClient;
    let testPersonId: string | null = null;

    beforeAll(async () => {
        // Log authentication status
        logAuthStatus();
        
        try {
            client = createTestClient();
            console.log('✅ Test client created successfully');
        } catch (error) {
            console.log('❌ No credentials available for integration test');
            console.log('💡 To run this test with real API calls:');
            console.log('   1. Set PCO_PERSONAL_ACCESS_TOKEN in .env.test, or');
            console.log('   2. Set PCO_ACCESS_TOKEN and PCO_REFRESH_TOKEN in .env.test');
            throw error;
        }
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            try {
                await client.people.delete(testPersonId);
                console.log('🧹 Cleaned up test person:', testPersonId);
            } catch (error) {
                console.warn('⚠️  Failed to clean up test person:', error);
            }
        }
    }, 30000);

    describe('findOrCreate Bug Fix Verification', () => {
        it('should find existing person by email instead of creating duplicate', async () => {
            const timestamp = Date.now();
            const testEmail = `${TEST_PREFIX}_email_${timestamp}@example.com`;
            
            console.log('🧪 Test: Finding existing person by email');
            console.log('📧 Test email:', testEmail);

            // Step 1: Create a person with email
            console.log('Step 1: Creating initial person...');
            const initialPerson = await client.people.create({
                first_name: `${TEST_PREFIX}_Initial_${timestamp}`,
                last_name: `${TEST_PREFIX}_Person_${timestamp}`,
            });

            // Add email to the person
            await client.people.addEmail(initialPerson.id, {
                address: testEmail,
                primary: true
            });

            console.log('✅ Initial person created:', initialPerson.id);
            testPersonId = initialPerson.id; // Track for cleanup

            // Step 2: Try to find the same person using findOrCreate
            console.log('Step 2: Using findOrCreate to find existing person...');
            const foundPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Initial_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                matchStrategy: 'exact'
            });

            // Verify we found the existing person, not created a new one
            expect(foundPerson.id).toBe(initialPerson.id);
            console.log('✅ Found existing person (no duplicate created):', foundPerson.id);

            // Verify the person has the email
            const emails = await client.people.getEmails(foundPerson.id);
            const hasTestEmail = emails.data.some(email => email.attributes.address === testEmail);
            expect(hasTestEmail).toBe(true);
            console.log('✅ Person has the expected email address');
        }, 30000);

        it('should find existing person by phone instead of creating duplicate', async () => {
            const timestamp = Date.now();
            const testPhone = `555-${timestamp.toString().slice(-4)}`;
            
            console.log('🧪 Test: Finding existing person by phone');
            console.log('📞 Test phone:', testPhone);

            // Step 1: Create a person with phone
            console.log('Step 1: Creating initial person...');
            const initialPerson = await client.people.create({
                first_name: `${TEST_PREFIX}_Phone_${timestamp}`,
                last_name: `${TEST_PREFIX}_Person_${timestamp}`,
            });

            // Add phone to the person
            await client.people.addPhoneNumber(initialPerson.id, {
                number: testPhone,
                primary: true
            });

            console.log('✅ Initial person created:', initialPerson.id);

            // Step 2: Try to find the same person using findOrCreate
            console.log('Step 2: Using findOrCreate to find existing person...');
            const foundPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Phone_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                phone: testPhone,
                matchStrategy: 'exact'
            });

            // Verify we found the existing person, not created a new one
            expect(foundPerson.id).toBe(initialPerson.id);
            console.log('✅ Found existing person (no duplicate created):', foundPerson.id);

            // Verify the person has the phone
            const phones = await client.people.getPhoneNumbers(foundPerson.id);
            const hasTestPhone = phones.data.some(phone => phone.attributes.number === testPhone);
            expect(hasTestPhone).toBe(true);
            console.log('✅ Person has the expected phone number');
        }, 30000);

        it('should create new person with contact info when no match found', async () => {
            const timestamp = Date.now();
            const uniqueEmail = `${TEST_PREFIX}_unique_${timestamp}@example.com`;
            const uniquePhone = `555-${timestamp.toString().slice(-4)}`;
            
            console.log('🧪 Test: Creating new person when no match exists');
            console.log('📧 Unique email:', uniqueEmail);
            console.log('📞 Unique phone:', uniquePhone);

            // Use findOrCreate for a person that definitely doesn't exist
            const newPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Unique_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: uniqueEmail,
                phone: uniquePhone,
                matchStrategy: 'exact'
            });

            console.log('✅ New person created:', newPerson.id);

            // Verify the person has the email
            const emails = await client.people.getEmails(newPerson.id);
            const hasEmail = emails.data.some(email => email.attributes.address === uniqueEmail);
            expect(hasEmail).toBe(true);
            console.log('✅ Person has the expected email address');

            // Verify the person has the phone
            const phones = await client.people.getPhoneNumbers(newPerson.id);
            const hasPhone = phones.data.some(phone => phone.attributes.number === uniquePhone);
            expect(hasPhone).toBe(true);
            console.log('✅ Person has the expected phone number');

            // Clean up this test person
            await client.people.delete(newPerson.id);
            console.log('🧹 Cleaned up test person:', newPerson.id);
        }, 30000);

        it('should demonstrate search parameter mapping', async () => {
            console.log('🧪 Test: Verifying search parameter mapping');
            
            // This test shows what parameters are actually sent to the API
            const timestamp = Date.now();
            const testEmail = `${TEST_PREFIX}_search_test_${timestamp}@example.com`;
            
            // Create a person first
            const person = await client.people.create({
                first_name: `${TEST_PREFIX}_Search_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            });

            await client.people.addEmail(person.id, {
                address: testEmail,
                primary: true
            });

            console.log('✅ Test person created:', person.id);

            // Now search for the person using the search method directly
            // This will show us what parameters are sent to the API
            console.log('🔍 Testing search method with email...');
            const searchResults = await client.people.search({ email: testEmail });
            
            console.log('📊 Search results:', {
                found: searchResults.data.length > 0,
                personId: searchResults.data[0]?.id,
                totalCount: searchResults.meta?.total_count
            });

            // Verify we found the person
            expect(searchResults.data.length).toBeGreaterThan(0);
            expect(searchResults.data[0].id).toBe(person.id);
            console.log('✅ Search method correctly found the person');

            // Clean up
            await client.people.delete(person.id);
            console.log('🧹 Cleaned up test person:', person.id);
        }, 30000);
    });
});
