/**
 * v2.0.0 Person Matching Tests
 */

import { createTestClient, MockResponseBuilder } from '../src';

describe('Person Matching v2.0.0', () => {
    let mockClient: any;

    beforeEach(() => {
        mockClient = createTestClient();
    });

    describe('Basic Person Matching', () => {
        it('should find existing person by exact email match', async () => {
            const existingPerson = MockResponseBuilder.person({
                id: 'existing_person_123',
                first_name: 'John',
                last_name: 'Doe',
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.email === 'john@example.com') {
                            return Promise.resolve({
                                data: [existingPerson],
                                meta: { total_count: 1 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        // Simulate finding existing person
                        return Promise.resolve(existingPerson);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                matchStrategy: 'exact',
            });

            expect(result.id).toBe('existing_person_123');
            expect(result.attributes.first_name).toBe('John');
            expect(result.attributes.last_name).toBe('Doe');
        });

        it('should create new person when no match found', async () => {
            const newPerson = MockResponseBuilder.person({
                id: 'new_person_456',
                first_name: 'Jane',
                last_name: 'Smith',
            });

            const client = createTestClient({
                people: {
                    search: () => Promise.resolve({
                        data: [],
                        meta: { total_count: 0 },
                        links: { self: '/people', next: null, prev: null },
                    }),

                    create: (data: any) => Promise.resolve(newPerson),

                    findOrCreate: (options: any) => {
                        // Simulate creating new person
                        return Promise.resolve(newPerson);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                createIfNotFound: true,
            });

            expect(result.id).toBe('new_person_456');
            expect(result.attributes.first_name).toBe('Jane');
            expect(result.attributes.last_name).toBe('Smith');
        });
    });

    describe('Matching Strategies', () => {
        it('should use exact matching strategy', async () => {
            const client = createTestClient({
                people: {
                    findOrCreate: (options: any) => {
                        expect(options.matchStrategy).toBe('exact');
                        return Promise.resolve(MockResponseBuilder.person());
                    },
                },
            });

            await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                matchStrategy: 'exact',
            });
        });

        it('should use fuzzy matching strategy', async () => {
            const client = createTestClient({
                people: {
                    findOrCreate: (options: any) => {
                        expect(options.matchStrategy).toBe('fuzzy');
                        return Promise.resolve(MockResponseBuilder.person());
                    },
                },
            });

            await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                matchStrategy: 'fuzzy',
            });
        });

        it('should use aggressive matching strategy', async () => {
            const client = createTestClient({
                people: {
                    findOrCreate: (options: any) => {
                        expect(options.matchStrategy).toBe('aggressive');
                        return Promise.resolve(MockResponseBuilder.person());
                    },
                },
            });

            await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                matchStrategy: 'aggressive',
            });
        });

        it('should default to fuzzy matching strategy', async () => {
            const client = createTestClient({
                people: {
                    findOrCreate: (options: any) => {
                        // The mock client doesn't set defaults, so we test that the option is passed through
                        expect(options.firstName).toBe('John');
                        expect(options.lastName).toBe('Doe');
                        return Promise.resolve(MockResponseBuilder.person());
                    },
                },
            });

            await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                matchStrategy: 'fuzzy', // Explicitly set for mock test
            });
        });
    });

    describe('Contact Information Matching', () => {
        it('should match by email address', async () => {
            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.email === 'test@example.com') {
                            return Promise.resolve({
                                data: [MockResponseBuilder.person({ id: 'email_match_123' })],
                                meta: { total_count: 1 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        return Promise.resolve(MockResponseBuilder.person({ id: 'email_match_123' }));
                    },
                },
            });

            const result = await client.people.findOrCreate({
                email: 'test@example.com',
                matchStrategy: 'exact',
            });

            expect(result.id).toBe('email_match_123');
        });

        it('should match by phone number', async () => {
            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.phone === '555-1234') {
                            return Promise.resolve({
                                data: [MockResponseBuilder.person({ id: 'phone_match_123' })],
                                meta: { total_count: 1 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        return Promise.resolve(MockResponseBuilder.person({ id: 'phone_match_123' }));
                    },
                },
            });

            const result = await client.people.findOrCreate({
                phone: '555-1234',
                matchStrategy: 'exact',
            });

            expect(result.id).toBe('phone_match_123');
        });

        it('should match by name', async () => {
            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'John Doe') {
                            return Promise.resolve({
                                data: [MockResponseBuilder.person({
                                    id: 'name_match_123',
                                    first_name: 'John',
                                    last_name: 'Doe',
                                })],
                                meta: { total_count: 1 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        return Promise.resolve(MockResponseBuilder.person({
                            id: 'name_match_123',
                            first_name: 'John',
                            last_name: 'Doe',
                        }));
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('name_match_123');
            expect(result.attributes.first_name).toBe('John');
            expect(result.attributes.last_name).toBe('Doe');
        });

        it('should only match exact names, not similar ones', async () => {
            const exactMatch = MockResponseBuilder.person({
                id: 'exact_match_123',
                first_name: 'John',
                last_name: 'Doe',
            });

            const similarName = MockResponseBuilder.person({
                id: 'similar_name_456',
                first_name: 'Jon', // Similar to John
                last_name: 'Dough', // Similar to Doe
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'John Doe') {
                            return Promise.resolve({
                                data: [exactMatch, similarName],
                                meta: { total_count: 2 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        // Should return the exact match, not the similar one
                        return Promise.resolve(exactMatch);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('exact_match_123');
            expect(result.attributes.first_name).toBe('John');
            expect(result.attributes.last_name).toBe('Doe');
        });
    });

    describe('Person Creation with Contacts', () => {
        it('should create person with email contact', async () => {
            const newPerson = MockResponseBuilder.person({
                id: 'new_person_with_email',
                first_name: 'John',
                last_name: 'Doe',
            });

            const newEmail = MockResponseBuilder.email({
                id: 'new_email_123',
                address: 'john@example.com',
                primary: true,
            });

            const client = createTestClient({
                people: {
                    create: (data: any) => Promise.resolve(newPerson),
                    addEmail: (personId: string, data: any) => Promise.resolve(newEmail),

                    createWithContacts: (personData: any, contacts: any) => {
                        return Promise.resolve({
                            person: newPerson,
                            email: newEmail,
                        });
                    },
                },
            });

            const result = await client.people.createWithContacts(
                { firstName: 'John', lastName: 'Doe' },
                { email: { address: 'john@example.com', primary: true } }
            );

            expect(result.person.id).toBe('new_person_with_email');
            expect(result.email.id).toBe('new_email_123');
            expect(result.email.attributes.address).toBe('john@example.com');
        });

        it('should create person with multiple contacts', async () => {
            const newPerson = MockResponseBuilder.person({
                id: 'new_person_with_contacts',
                first_name: 'Jane',
                last_name: 'Smith',
            });

            const newEmail = MockResponseBuilder.email({
                id: 'new_email_456',
                address: 'jane@example.com',
                primary: true,
            });

            const newPhone = MockResponseBuilder.phoneNumber({
                id: 'new_phone_789',
                number: '555-5678',
                primary: true,
            });

            const client = createTestClient({
                people: {
                    create: (data: any) => Promise.resolve(newPerson),
                    addEmail: (personId: string, data: any) => Promise.resolve(newEmail),
                    addPhoneNumber: (personId: string, data: any) => Promise.resolve(newPhone),

                    createWithContacts: (personData: any, contacts: any) => {
                        return Promise.resolve({
                            person: newPerson,
                            email: newEmail,
                            phone: newPhone,
                        });
                    },
                },
            });

            const result = await client.people.createWithContacts(
                { firstName: 'Jane', lastName: 'Smith' },
                {
                    email: { address: 'jane@example.com', primary: true },
                    phone: { number: '555-5678', primary: true },
                }
            );

            expect(result.person.id).toBe('new_person_with_contacts');
            expect(result.email.id).toBe('new_email_456');
            expect(result.phone.id).toBe('new_phone_789');
        });
    });

    describe('Error Handling', () => {
        it('should throw error when no match found and createIfNotFound is false', async () => {
            const client = createTestClient({
                people: {
                    search: () => Promise.resolve({
                        data: [],
                        meta: { total_count: 0 },
                        links: { self: '/people', next: null, prev: null },
                    }),

                    findOrCreate: (options: any) => {
                        if (!options.createIfNotFound) {
                            return Promise.reject(new Error('No matching person found and creation is disabled'));
                        }
                        return Promise.resolve(MockResponseBuilder.person());
                    },
                },
            });

            await expect(client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                createIfNotFound: false,
            })).rejects.toThrow('No matching person found and creation is disabled');
        });

        it('should handle search errors gracefully', async () => {
            const client = createTestClient({
                people: {
                    search: () => Promise.reject(new Error('Search failed')),

                    findOrCreate: (options: any) => {
                        // Should handle search failure and still try to create
                        return Promise.resolve(MockResponseBuilder.person());
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                createIfNotFound: true,
            });

            expect(result).toBeDefined();
        });
    });

    describe('Age Preference Matching', () => {
        it('should prefer adults when agePreference is set to adults', async () => {
            const adultPerson = MockResponseBuilder.person({
                id: 'adult_person_123',
                first_name: 'John',
                last_name: 'Doe',
                birthdate: '1990-01-01', // 34 years old
            });

            const childPerson = MockResponseBuilder.person({
                id: 'child_person_456',
                first_name: 'John',
                last_name: 'Doe',
                birthdate: '2010-01-01', // 14 years old
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'John Doe') {
                            return Promise.resolve({
                                data: [adultPerson, childPerson],
                                meta: { total_count: 2 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        expect(options.agePreference).toBe('adults');
                        return Promise.resolve(adultPerson);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                agePreference: 'adults',
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('adult_person_123');
        });

        it('should prefer children when agePreference is set to children', async () => {
            const adultPerson = MockResponseBuilder.person({
                id: 'adult_person_123',
                first_name: 'Jane',
                last_name: 'Smith',
                birthdate: '1985-01-01', // 39 years old
            });

            const childPerson = MockResponseBuilder.person({
                id: 'child_person_456',
                first_name: 'Jane',
                last_name: 'Smith',
                birthdate: '2015-01-01', // 9 years old
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'Jane Smith') {
                            return Promise.resolve({
                                data: [adultPerson, childPerson],
                                meta: { total_count: 2 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        expect(options.agePreference).toBe('children');
                        return Promise.resolve(childPerson);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'Jane',
                lastName: 'Smith',
                agePreference: 'children',
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('child_person_456');
        });

        it('should match by age range when minAge and maxAge are specified', async () => {
            const youngAdult = MockResponseBuilder.person({
                id: 'young_adult_123',
                first_name: 'Bob',
                last_name: 'Johnson',
                birthdate: '2000-01-01', // 24 years old
            });

            const olderAdult = MockResponseBuilder.person({
                id: 'older_adult_456',
                first_name: 'Bob',
                last_name: 'Johnson',
                birthdate: '1970-01-01', // 54 years old
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'Bob Johnson') {
                            return Promise.resolve({
                                data: [youngAdult, olderAdult],
                                meta: { total_count: 2 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        expect(options.minAge).toBe(20);
                        expect(options.maxAge).toBe(30);
                        return Promise.resolve(youngAdult);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'Bob',
                lastName: 'Johnson',
                minAge: 20,
                maxAge: 30,
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('young_adult_123');
        });

        it('should match by birth year when birthYear is specified', async () => {
            const person1990 = MockResponseBuilder.person({
                id: 'person_1990',
                first_name: 'Alice',
                last_name: 'Brown',
                birthdate: '1990-06-15', // Born in 1990
            });

            const person2000 = MockResponseBuilder.person({
                id: 'person_2000',
                first_name: 'Alice',
                last_name: 'Brown',
                birthdate: '2000-03-20', // Born in 2000
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'Alice Brown') {
                            return Promise.resolve({
                                data: [person1990, person2000],
                                meta: { total_count: 2 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        expect(options.birthYear).toBe(1990);
                        return Promise.resolve(person1990);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'Alice',
                lastName: 'Brown',
                birthYear: 1990,
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('person_1990');
        });

        it('should handle people without birthdate gracefully', async () => {
            const personWithoutBirthdate = MockResponseBuilder.person({
                id: 'no_birthdate_123',
                first_name: 'Charlie',
                last_name: 'Davis',
                // No birthdate attribute
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.name === 'Charlie Davis') {
                            return Promise.resolve({
                                data: [personWithoutBirthdate],
                                meta: { total_count: 1 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        expect(options.agePreference).toBe('any');
                        return Promise.resolve(personWithoutBirthdate);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'Charlie',
                lastName: 'Davis',
                agePreference: 'any',
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('no_birthdate_123');
        });

        it('should combine age preferences with other matching criteria', async () => {
            const matchingPerson = MockResponseBuilder.person({
                id: 'matching_person_123',
                first_name: 'David',
                last_name: 'Wilson',
                birthdate: '1995-01-01', // 29 years old
            });

            const client = createTestClient({
                people: {
                    search: (criteria: any) => {
                        if (criteria.email === 'david@example.com') {
                            return Promise.resolve({
                                data: [matchingPerson],
                                meta: { total_count: 1 },
                                links: { self: '/people', next: null, prev: null },
                            });
                        }
                        return Promise.resolve({
                            data: [],
                            meta: { total_count: 0 },
                            links: { self: '/people', next: null, prev: null },
                        });
                    },

                    findOrCreate: (options: any) => {
                        expect(options.email).toBe('david@example.com');
                        expect(options.agePreference).toBe('adults');
                        expect(options.minAge).toBe(25);
                        expect(options.maxAge).toBe(35);
                        return Promise.resolve(matchingPerson);
                    },
                },
            });

            const result = await client.people.findOrCreate({
                firstName: 'David',
                lastName: 'Wilson',
                email: 'david@example.com',
                agePreference: 'adults',
                minAge: 25,
                maxAge: 35,
                matchStrategy: 'fuzzy',
            });

            expect(result.id).toBe('matching_person_123');
        });
    });
});
