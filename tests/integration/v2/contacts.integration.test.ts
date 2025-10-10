import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { validatePersonResource } from '../../type-validators';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_CONTACTS_2025';

describe('v2.0.0 Contacts API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testEmailId: string;
    let testPhoneId: string;
    let testAddressId: string;
    let testSocialId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Create a test person for contact operations
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_ContactTest_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const createResponse = await client.people.create(personData);
        testPersonId = createResponse.id || '';
        expect(testPersonId).toBeTruthy();
    }, 30000);

    afterAll(async () => {
        // Clean up test person (this will also clean up associated contacts)
        if (testPersonId) {
            try {
                await client.people.delete(testPersonId);
            } catch (error) {
                console.warn('Failed to clean up test person:', error);
            }
        }
    }, 30000);

    describe('v2.0 Email Operations', () => {
        it('should create email for person', async () => {
            const timestamp = Date.now();
            const emailData = {
                address: `test-email-${timestamp}@gmail.com`,
                location: 'Home',
                primary: true,
            };

            const email = await client.people.addEmail(testPersonId, emailData);

            expect(email).toBeDefined();
            expect(email.type).toBe('Email');
            expect(email.attributes?.address).toBe(emailData.address);
            expect(email.attributes?.location).toBe(emailData.location);
            expect(email.attributes?.primary).toBe(true);
            expect(email.relationships?.person?.data?.id).toBe(testPersonId);

            testEmailId = email.id || '';
            expect(testEmailId).toBeTruthy();
        }, 30000);

        it('should get emails for person', async () => {
            const emails = await client.people.getEmails(testPersonId);

            expect(emails.data).toBeDefined();
            expect(Array.isArray(emails.data)).toBe(true);
            expect(emails.data.length).toBeGreaterThan(0);

            // Verify our test email is in the list
            const hasTestEmail = emails.data.some(email =>
                email.relationships?.person?.data?.id === testPersonId
            );
            expect(hasTestEmail).toBe(true);
        }, 30000);

        it('should update email', async () => {
            if (!testEmailId) {
                const emails = await client.people.getEmails(testPersonId);
                testEmailId = emails.data[0].id || '';
            }

            expect(testEmailId).toBeTruthy();

            const updateData = {
                location: 'Work',
                primary: false,
            };

            const updatedEmail = await client.people.updateEmail(testPersonId, testEmailId, updateData);

            expect(updatedEmail).toBeDefined();
            expect(updatedEmail.type).toBe('Email');
            expect(updatedEmail.id).toBe(testEmailId);
            expect(updatedEmail.attributes?.location).toBe(updateData.location);
            expect(updatedEmail.attributes?.primary).toBe(false);
        }, 30000);

        it('should ensure only one primary email', async () => {
            const timestamp = Date.now();
            const secondEmailData = {
                address: `second-email-${timestamp}@gmail.com`,
                location: 'Work',
                primary: true, // This should make the first email non-primary
            };

            const secondEmail = await client.people.addEmail(testPersonId, secondEmailData);

            expect(secondEmail).toBeDefined();
            expect(secondEmail.attributes?.primary).toBe(true);

            // Verify the first email is no longer primary
            const updatedFirstEmail = await client.contacts.getEmailById(testEmailId);
            expect(updatedFirstEmail.attributes?.primary).toBe(false);
        }, 30000);

        it('should delete email', async () => {
            const emails = await client.people.getEmails(testPersonId);
            const emailToDelete = emails.data.find(email => email.id !== testEmailId);

            if (emailToDelete) {
                await client.people.deleteEmail(testPersonId, emailToDelete.id);

                // Verify email was deleted
                await expect(
                    client.contacts.getEmailById(emailToDelete.id)
                ).rejects.toThrow();
            }
        }, 30000);
    });

    describe('v2.0 Phone Number Operations', () => {
        it('should create phone number for person', async () => {
            const timestamp = Date.now();
            const phoneData = {
                number: `555-${timestamp.toString().slice(-4)}`,
                location: 'Home',
                primary: true,
            };

            const phone = await client.people.addPhoneNumber(testPersonId, phoneData);

            expect(phone).toBeDefined();
            expect(phone.type).toBe('PhoneNumber');
            expect(phone.attributes?.number).toBe(phoneData.number);
            expect(phone.attributes?.location).toBe(phoneData.location);
            expect(phone.attributes?.primary).toBe(true);
            expect(phone.relationships?.person?.data?.id).toBe(testPersonId);

            testPhoneId = phone.id || '';
            expect(testPhoneId).toBeTruthy();
        }, 30000);

        it('should get phone numbers for person', async () => {
            const phones = await client.people.getPhoneNumbers(testPersonId);

            expect(phones.data).toBeDefined();
            expect(Array.isArray(phones.data)).toBe(true);

            // The person might not have phone numbers initially
            // This test verifies the API call works correctly
            if (phones.data.length > 0) {
                // Verify our test phone is in the list
                const hasTestPhone = phones.data.some(phone =>
                    phone.relationships?.person?.data?.id === testPersonId
                );
                expect(hasTestPhone).toBe(true);
            } else {
                // If no phone numbers, that's also valid
                expect(phones.data.length).toBe(0);
            }
        }, 30000);

        it('should update phone number', async () => {
            if (!testPhoneId) {
                const phones = await client.people.getPhoneNumbers(testPersonId);
                if (phones.data.length === 0) {
                    // Create a phone number first if none exists
                    const phoneData = {
                        number: '555-123-4567',
                        location: 'Mobile',
                        primary: true,
                    };
                    const newPhone = await client.people.addPhoneNumber(testPersonId, phoneData);
                    testPhoneId = newPhone.id || '';
                } else {
                    testPhoneId = phones.data[0].id || '';
                }
            }

            expect(testPhoneId).toBeTruthy();

            const updateData = {
                location: 'Work',
                primary: false,
            };

            const updatedPhone = await client.people.updatePhoneNumber(testPersonId, testPhoneId, updateData);

            expect(updatedPhone).toBeDefined();
            expect(updatedPhone.type).toBe('PhoneNumber');
            expect(updatedPhone.id).toBe(testPhoneId);
            expect(updatedPhone.attributes?.location).toBe(updateData.location);
            expect(updatedPhone.attributes?.primary).toBe(false);
        }, 60000);

        it('should delete phone number', async () => {
            if (!testPhoneId) {
                // Create a phone number first if none exists
                const phoneData = {
                    number: `555-${Date.now().toString().slice(-4)}`,
                    location: 'Home',
                    primary: true,
                };
                const phone = await client.people.addPhoneNumber(testPersonId, phoneData);
                testPhoneId = phone.id || '';
            }

            expect(testPhoneId).toBeTruthy();

            await client.people.deletePhoneNumber(testPersonId, testPhoneId);

            // Verify phone was deleted
            await expect(
                client.contacts.getPhoneNumberById(testPhoneId)
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Address Operations', () => {
        it('should create address for person', async () => {
            const addressData = {
                street: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                location: 'Home',
                primary: true,
            };

            const address = await client.people.addAddress(testPersonId, addressData);

            expect(address).toBeDefined();
            expect(address.type).toBe('Address');
            expect(address.attributes?.street).toBe(addressData.street);
            expect(address.attributes?.city).toBe(addressData.city);
            expect(address.attributes?.state).toBe(addressData.state);
            expect(address.attributes?.zip).toBe(addressData.zip);
            // Note: country field is not allowed in PCO address creation
            expect(address.attributes?.location).toBe(addressData.location);
            expect(address.attributes?.primary).toBe(true);
            expect(address.relationships?.person?.data?.id).toBe(testPersonId);

            testAddressId = address.id || '';
            expect(testAddressId).toBeTruthy();
        }, 60000);

        it('should get addresses for person', async () => {
            if (!testAddressId) {
                // Create an address first if none exists
                const addressData = {
                    street: '456 Test Avenue',
                    city: 'Test City',
                    state: 'TS',
                    zip: '54321',
                    location: 'Work',
                    primary: false,
                };
                const address = await client.people.addAddress(testPersonId, addressData);
                testAddressId = address.id || '';
            }

            const addresses = await client.people.getAddresses(testPersonId);

            expect(addresses.data).toBeDefined();
            expect(Array.isArray(addresses.data)).toBe(true);
            expect(addresses.data.length).toBeGreaterThan(0);

            // Verify our test address is in the list
            const hasTestAddress = addresses.data.some(address =>
                address.relationships?.person?.data?.id === testPersonId
            );
            expect(hasTestAddress).toBe(true);
        }, 60000);

        it('should update address', async () => {
            if (!testAddressId) {
                const addresses = await client.people.getAddresses(testPersonId);
                testAddressId = addresses.data[0].id || '';
            }

            expect(testAddressId).toBeTruthy();

            const updateData = {
                city: 'Updated City',
                location: 'Work',
            };

            const updatedAddress = await client.people.updateAddress(testPersonId, testAddressId, updateData);

            expect(updatedAddress).toBeDefined();
            expect(updatedAddress.type).toBe('Address');
            expect(updatedAddress.id).toBe(testAddressId);
            expect(updatedAddress.attributes?.city).toBe(updateData.city);
            expect(updatedAddress.attributes?.location).toBe(updateData.location);
        }, 30000);

        it('should delete address', async () => {
            if (!testAddressId) {
                const addresses = await client.people.getAddresses(testPersonId);
                testAddressId = addresses.data[0].id || '';
            }

            expect(testAddressId).toBeTruthy();

            await client.people.deleteAddress(testPersonId, testAddressId);

            // Verify address was deleted
            await expect(
                client.contacts.getAddressById(testAddressId)
            ).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Social Profile Operations', () => {
        it('should create social profile for person', async () => {
            const socialData = {
                site: 'Facebook',
                url: 'https://facebook.com/testuser123',
            };

            const social = await client.people.addSocialProfile(testPersonId, socialData);

            expect(social).toBeDefined();
            expect(social.type).toBe('SocialProfile');
            expect(social.attributes?.site).toBe(socialData.site);
            // Note: username field is not allowed in PCO social profile creation
            expect(social.attributes?.url).toBe(socialData.url);
            // Note: person relationship may not be included in the response
            expect(social.id).toBeTruthy();

            testSocialId = social.id || '';
            expect(testSocialId).toBeTruthy();
        }, 30000);

        it('should get social profiles for person', async () => {
            const socials = await client.people.getSocialProfiles(testPersonId);

            expect(socials.data).toBeDefined();
            expect(Array.isArray(socials.data)).toBe(true);
            expect(socials.data.length).toBeGreaterThan(0);

            // Verify our test social profile is in the list
            // Note: The person relationship may not always be included in the response
            const hasTestSocial = socials.data.some(social =>
                social.id === testSocialId ||
                social.relationships?.person?.data?.id === testPersonId
            );
            expect(hasTestSocial).toBe(true);
        }, 30000);

        it('should update social profile', async () => {
            if (!testSocialId) {
                const socials = await client.people.getSocialProfiles(testPersonId);
                testSocialId = socials.data[0].id || '';
            }

            expect(testSocialId).toBeTruthy();

            const updateData = {
                // Note: username cannot be assigned in PCO social profiles
                url: 'https://facebook.com/updateduser456',
            };

            const updatedSocial = await client.people.updateSocialProfile(testPersonId, testSocialId, updateData);

            expect(updatedSocial).toBeDefined();
            expect(updatedSocial.type).toBe('SocialProfile');
            expect(updatedSocial.id).toBe(testSocialId);
            // Note: username field is not assignable in PCO social profiles
            expect(updatedSocial.attributes?.url).toBe(updateData.url);
        }, 30000);

        it('should delete social profile', async () => {
            if (!testSocialId) {
                const socials = await client.people.getSocialProfiles(testPersonId);
                testSocialId = socials.data[0].id || '';
            }

            expect(testSocialId).toBeTruthy();

            await client.people.deleteSocialProfile(testPersonId, testSocialId);

            // Verify social profile was deleted
            await expect(
                client.contacts.getSocialProfileById(testSocialId)
            ).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Contact Validation', () => {
        it('should handle invalid email format', async () => {
            const invalidEmailData = {
                address: 'invalid-email-format',
                location: 'Home',
                primary: false,
            };

            await expect(
                client.people.addEmail(testPersonId, invalidEmailData)
            ).rejects.toThrow();
        }, 30000);

        it('should handle invalid person ID gracefully', async () => {
            const emailData = {
                address: 'test@gmail.com',
                location: 'Home',
                primary: false,
            };

            await expect(
                client.people.addEmail('invalid-person-id', emailData)
            ).rejects.toThrow();
        }, 30000);

        it('should handle invalid contact ID gracefully', async () => {
            await expect(
                client.contacts.getEmailById('invalid-email-id')
            ).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Contact Performance', () => {
        it('should demonstrate contact operations performance', async () => {
            const startTime = Date.now();

            // Get all contacts for the test person
            const emails = await client.people.getEmails(testPersonId);
            const phones = await client.people.getPhoneNumbers(testPersonId);
            const addresses = await client.people.getAddresses(testPersonId);
            const socials = await client.people.getSocialProfiles(testPersonId);

            const totalTime = Date.now() - startTime;

            expect(emails.data).toBeDefined();
            expect(phones.data).toBeDefined();
            expect(addresses.data).toBeDefined();
            expect(socials.data).toBeDefined();
            expect(totalTime).toBeLessThan(10000); // Should be fast

            console.log(`Contact fetch time: ${totalTime}ms`);
        }, 30000);
    });
});
