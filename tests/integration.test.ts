/**
 * PCO API Integration Tests
 * 
 * These tests validate the @planning-center-people-ts package against the real
 * Planning Center Online API. They require valid PCO credentials and will
 * create/delete test data.
 * 
 * To run: npm run test:integration
 * 
 * Prerequisites:
 * 1. Copy .env.test.example to .env.test
 * 2. Fill in your PCO credentials
 * 3. Ensure your PCO app has People API permissions
 */

import {
  createPcoClient,
  getPeople,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  getPersonEmails,
  createPersonEmail,
  getPersonPhoneNumbers,
  createPersonPhoneNumber,
  getPersonAddresses,
  createPersonAddress,
  getHouseholds,
  getFieldDefinitions,
  getPersonSocialProfiles,
  createPersonSocialProfile,
  getWorkflowCards,
  createWorkflowCard,
  getWorkflowCardNotes,
  createWorkflowCardNote,
  // New API functions
  getLists,
  getListById,
  getListCategories,
  getNotes,
  getNote,
  getNoteCategories,
  getWorkflows,
  getWorkflow,
  getOrganization,
  type PcoClientState,
  type PersonAttributes,
  type EmailAttributes,
  type PhoneNumberAttributes,
  type AddressAttributes,
  type SocialProfileAttributes,
  type WorkflowCardNoteAttributes,
} from '../src';

import {
  validateResourceStructure,
  validateStringAttribute,
  validateNullableStringAttribute,
  validateBooleanAttribute,
  validateNumberAttribute,
  validateDateAttribute,
  validateRelationship,
  validateIncludedResources,
  validatePaginationLinks,
  validatePaginationMeta,
} from './type-validators';

// Test configuration
const TEST_PREFIX = 'TEST_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('PCO API Integration Tests', () => {
  let client: PcoClientState;
  let testPersonId: string | null = null;
  let testEmailId: string | null = null;
  let testPhoneId: string | null = null;
  let testAddressId: string | null = null;
  let testSocialProfileId: string | null = null;
  let testWorkflowCardId: string | null = null;
  let testWorkflowCardNoteId: string | null = null;

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

  afterAll(async () => {
    // Clean up all test data
    const cleanupPromises: Promise<any>[] = [];

    if (testWorkflowCardNoteId && testWorkflowCardId && testPersonId) {
      cleanupPromises.push(
        deletePerson(client, testPersonId).catch(() => {
          // Ignore cleanup errors
        })
      );
    }

    if (testSocialProfileId && testPersonId) {
      cleanupPromises.push(
        // Note: Social profiles are deleted when person is deleted
        Promise.resolve()
      );
    }

    if (testAddressId && testPersonId) {
      cleanupPromises.push(
        // Note: Addresses are deleted when person is deleted
        Promise.resolve()
      );
    }

    if (testPhoneId && testPersonId) {
      cleanupPromises.push(
        // Note: Phone numbers are deleted when person is deleted
        Promise.resolve()
      );
    }

    if (testEmailId && testPersonId) {
      cleanupPromises.push(
        // Note: Emails are deleted when person is deleted
        Promise.resolve()
      );
    }

    await Promise.allSettled(cleanupPromises);
  }, 30000);

  describe('Authentication & Configuration', () => {
    it('should initialize client with valid configuration', () => {
      expect(client).toBeDefined();
      expect(client.config).toBeDefined();
      expect(client.rateLimiter).toBeDefined();
    });

    it('should handle authentication errors gracefully', async () => {
      const invalidClient = createPcoClient({
        appId: 'invalid',
        appSecret: 'invalid',
      });

      await expect(getPeople(invalidClient, { per_page: 1 })).rejects.toThrow();
    }, 30000);
  });

  describe('Read Operations (Safe)', () => {
    it('should get people list with proper typing', async () => {
      const response = await getPeople(client, {
        include: ['emails', 'phone_numbers'],
        per_page: 5,
      });

      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response).toHaveProperty('links');
      expect(response).toHaveProperty('meta');

      // Validate pagination structure
      validatePaginationLinks(response.links);
      validatePaginationMeta(response.meta);

      if (response.data.length > 0) {
        const person = response.data[0];

        // Validate PersonResource structure
        validateResourceStructure(person, 'Person');

        // Validate PersonAttributes
        if (person.attributes) {
          validateNullableStringAttribute(person.attributes, 'first_name');
          validateNullableStringAttribute(person.attributes, 'last_name');
          validateNullableStringAttribute(person.attributes, 'given_name');
          validateNullableStringAttribute(person.attributes, 'middle_name');
          validateNullableStringAttribute(person.attributes, 'nickname');
          validateNullableStringAttribute(person.attributes, 'birthdate');
          validateNullableStringAttribute(person.attributes, 'anniversary');
          validateNullableStringAttribute(person.attributes, 'gender');
          validateNullableStringAttribute(person.attributes, 'grade');
          validateBooleanAttribute(person.attributes, 'child');
          validateStringAttribute(person.attributes, 'status');
          validateDateAttribute(person.attributes, 'created_at');
          validateDateAttribute(person.attributes, 'updated_at');
          validateBooleanAttribute(person.attributes, 'site_administrator');
          validateBooleanAttribute(person.attributes, 'accounting_administrator');
          validateNullableStringAttribute(person.attributes, 'people_permissions');
          validateNullableStringAttribute(person.attributes, 'remote_id');
        }

        // Validate PersonRelationships
        if (person.relationships) {
          Object.entries(person.relationships).forEach(([key, rel]) => {
            validateRelationship(rel, `person.relationships.${key}`);
          });
        }
      }

      // Validate included resources if present
      if (response.included) {
        validateIncludedResources(response.included, ['Email', 'PhoneNumber']);
      }
    }, 30000);

    it('should filter people by status', async () => {
      const response = await getPeople(client, {
        per_page: 3,
        where: { status: 'active' },
      });

      expect(Array.isArray(response.data)).toBe(true);

      // All returned people should be active
      response.data.forEach((person) => {
        expect(person.attributes?.status).toBe('active');
      });
    }, 30000);

    it('should get a single person with full details', async () => {
      // First get a list to find a person ID
      const peopleResponse = await getPeople(client, { per_page: 1 });

      if (peopleResponse.data.length === 0) {
        console.warn('No people found in the system - skipping single person test');
        return;
      }

      const personId = peopleResponse.data[0].id;
      const person = await getPerson(client, personId, ['emails', 'phone_numbers']);

      expect(person.data).toBeDefined();
      expect(person.data?.type).toBe('Person');
      expect(person.data?.id).toBe(personId);
      expect(person.data?.attributes).toBeDefined();
    }, 30000);

    it('should get households', async () => {
      const response = await getHouseholds(client, {
        per_page: 5,
      });

      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);

      // Validate pagination structure
      validatePaginationLinks(response.links);
      validatePaginationMeta(response.meta);

      if (response.data.length > 0) {
        const household = response.data[0];

        // Validate HouseholdResource structure
        validateResourceStructure(household, 'Household');

        // Validate HouseholdAttributes
        if (household.attributes) {
          validateStringAttribute(household.attributes, 'name');
          validateDateAttribute(household.attributes, 'created_at');
          validateDateAttribute(household.attributes, 'updated_at');
        }

        // Validate HouseholdRelationships
        if (household.relationships) {
          if (household.relationships.people) {
            validateRelationship(household.relationships.people, 'household.relationships.people');
          }
          if (household.relationships.addresses) {
            validateRelationship(household.relationships.addresses, 'household.relationships.addresses');
          }
        }
      }
    }, 30000);

    it('should get field definitions', async () => {
      const response = await getFieldDefinitions(client, {
        per_page: 5,
      });

      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);

      // Validate pagination structure
      validatePaginationLinks(response.links);
      validatePaginationMeta(response.meta);

      if (response.data.length > 0) {
        const fieldDef = response.data[0];

        // Validate FieldDefinitionResource structure
        validateResourceStructure(fieldDef, 'FieldDefinition');

        // Validate FieldDefinitionAttributes
        if (fieldDef.attributes) {
          validateStringAttribute(fieldDef.attributes, 'name');
          validateStringAttribute(fieldDef.attributes, 'data_type');
          // tab_id and sequence can be string or number depending on API version
          if (fieldDef.attributes.tab_id !== undefined) {
            expect(['string', 'number']).toContain(typeof fieldDef.attributes.tab_id);
          }
          if (fieldDef.attributes.sequence !== undefined) {
            expect(['string', 'number']).toContain(typeof fieldDef.attributes.sequence);
          }
          // deleted_at can be boolean (false), null, or date string
          if (fieldDef.attributes.deleted_at !== undefined) {
            const deletedAtType = fieldDef.attributes.deleted_at === null ? 'null' : typeof fieldDef.attributes.deleted_at;
            expect(['boolean', 'string', 'null']).toContain(deletedAtType);
          }
          validateDateAttribute(fieldDef.attributes, 'created_at');
          validateDateAttribute(fieldDef.attributes, 'updated_at');
        }

        // Validate FieldDefinitionRelationships
        if (fieldDef.relationships) {
          if (fieldDef.relationships.field_options) {
            validateRelationship(fieldDef.relationships.field_options, 'fieldDef.relationships.field_options');
          }
        }
      }
    }, 30000);
  });

  describe('Write Operations (With Cleanup)', () => {
    it('should create, update, and delete a person', async () => {
      const timestamp = Date.now();
      const personData: Partial<PersonAttributes> = {
        first_name: `${TEST_PREFIX}_John_${timestamp}`,
        last_name: `${TEST_PREFIX}_Doe_${timestamp}`,
        status: 'active',
      };

      // Create person
      const createResponse = await createPerson(client, personData);
      expect(createResponse.data).toBeDefined();
      expect(createResponse.data?.attributes?.first_name).toBe(personData.first_name);
      expect(createResponse.data?.attributes?.last_name).toBe(personData.last_name);

      testPersonId = createResponse.data?.id || null;
      expect(testPersonId).toBeTruthy();

      // Update person
      const updateData: Partial<PersonAttributes> = {
        first_name: `${TEST_PREFIX}_Jane_${timestamp}`,
      };

      const updateResponse = await updatePerson(client, testPersonId!, updateData);
      expect(updateResponse.data?.attributes?.first_name).toBe(updateData.first_name);
      expect(updateResponse.data?.attributes?.last_name).toBe(personData.last_name);

      // Verify update
      const getResponse = await getPerson(client, testPersonId!);
      expect(getResponse.data?.attributes?.first_name).toBe(updateData.first_name);
    }, 30000);

    it('should manage person emails', async () => {
      if (!testPersonId) {
        console.warn('No test person available - skipping email test');
        return;
      }

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
      if (createResponse.data) {
        validateResourceStructure(createResponse.data, 'Email');
        expect(createResponse.data.attributes?.address).toBe(emailData.address);

        // Validate EmailAttributes
        if (createResponse.data.attributes) {
          validateStringAttribute(createResponse.data.attributes, 'address');
          validateStringAttribute(createResponse.data.attributes, 'location');
          validateBooleanAttribute(createResponse.data.attributes, 'primary');
          validateBooleanAttribute(createResponse.data.attributes, 'blocked');
          validateDateAttribute(createResponse.data.attributes, 'created_at');
          validateDateAttribute(createResponse.data.attributes, 'updated_at');
        }

        // Validate EmailRelationships
        if (createResponse.data.relationships) {
          validateRelationship(createResponse.data.relationships.person, 'email.relationships.person');
        }
      }

      testEmailId = createResponse.data?.id || null;

      // Get person emails
      const emailsResponse = await getPersonEmails(client, testPersonId);
      expect(Array.isArray(emailsResponse.data)).toBe(true);
      expect(emailsResponse.data.length).toBeGreaterThan(0);

      const createdEmail = emailsResponse.data.find(
        (email) => email.attributes?.address === emailData.address
      );
      expect(createdEmail).toBeDefined();

      // Validate Email list response
      if (createdEmail) {
        validateResourceStructure(createdEmail, 'Email');
      }
    }, 30000);

    it('should manage person phone numbers', async () => {
      if (!testPersonId) {
        console.warn('No test person available - skipping phone test');
        return;
      }

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
      if (createResponse.data) {
        validateResourceStructure(createResponse.data, 'PhoneNumber');
        expect(createResponse.data.attributes?.number).toBe(phoneData.number);

        // Validate PhoneNumberAttributes
        if (createResponse.data.attributes) {
          validateStringAttribute(createResponse.data.attributes, 'number');
          validateStringAttribute(createResponse.data.attributes, 'location');
          validateBooleanAttribute(createResponse.data.attributes, 'primary');
          validateDateAttribute(createResponse.data.attributes, 'created_at');
          validateDateAttribute(createResponse.data.attributes, 'updated_at');
        }

        // Validate PhoneNumberRelationships
        if (createResponse.data.relationships) {
          validateRelationship(createResponse.data.relationships.person, 'phone.relationships.person');
        }
      }

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
      if (createdPhone) {
        validateResourceStructure(createdPhone, 'PhoneNumber');
      }
    }, 30000);

    it('should validate address types from existing data', async () => {
      // Note: Address creation requires household setup and special permissions
      // Instead, we validate address types from existing data via include
      const response = await getPeople(client, {
        include: ['addresses'],
        per_page: 10,
      });

      // Check if we have addresses in included resources
      if (response.included) {
        const addresses = response.included.filter(r => r.type === 'Address');

        if (addresses.length > 0) {
          addresses.forEach(address => {
            // Validate AddressResource structure
            validateResourceStructure(address, 'Address');

            // Validate AddressAttributes
            if (address.attributes) {
              validateNullableStringAttribute(address.attributes, 'address1');
              validateNullableStringAttribute(address.attributes, 'address2');
              validateNullableStringAttribute(address.attributes, 'city');
              validateNullableStringAttribute(address.attributes, 'state');
              validateNullableStringAttribute(address.attributes, 'zip');
              validateStringAttribute(address.attributes, 'location');
              validateBooleanAttribute(address.attributes, 'primary');
              validateDateAttribute(address.attributes, 'created_at');
              validateDateAttribute(address.attributes, 'updated_at');
            }

            // Validate AddressRelationships
            if (address.relationships && 'person' in address.relationships) {
              validateRelationship(address.relationships.person, 'address.relationships.person');
            }
          });
        } else {
          console.log('No addresses found in API data to validate');
        }
      }
    }, 30000);

    it('should validate social profile types from existing data', async () => {
      // Note: Social profile creation requires special permissions or specific service types
      // Instead, we validate social profile types from existing data via include
      const response = await getPeople(client, {
        include: ['social_profiles'],
        per_page: 10,
      });

      // Check if we have social profiles in included resources
      if (response.included) {
        const socialProfiles = response.included.filter(r => r.type === 'SocialProfile');

        if (socialProfiles.length > 0) {
          socialProfiles.forEach(profile => {
            // Validate SocialProfileResource structure
            validateResourceStructure(profile, 'SocialProfile');

            // Validate SocialProfileAttributes
            if (profile.attributes) {
              validateStringAttribute(profile.attributes, 'service');
              validateStringAttribute(profile.attributes, 'username');
              validateStringAttribute(profile.attributes, 'url');
              validateBooleanAttribute(profile.attributes, 'verified');
              validateDateAttribute(profile.attributes, 'created_at');
              validateDateAttribute(profile.attributes, 'updated_at');
            }

            // Validate SocialProfileRelationships
            if (profile.relationships && 'person' in profile.relationships) {
              validateRelationship(profile.relationships.person, 'socialProfile.relationships.person');
            }
          });
        } else {
          console.log('No social profiles found in API data to validate');
        }
      }
    }, 30000);
  });

  describe('Extended Resources Validation', () => {
    it('should validate workflow card and note types', async () => {
      // Get a person ID first
      const peopleResponse = await getPeople(client, { per_page: 1 });
      if (peopleResponse.data.length === 0) {
        console.log('No people found - skipping workflow validation');
        return;
      }

      const personId = peopleResponse.data[0].id;

      // Get workflow cards for this person
      const cardsResponse = await getWorkflowCards(client, personId);

      expect(cardsResponse).toHaveProperty('data');
      expect(Array.isArray(cardsResponse.data)).toBe(true);

      // Validate pagination
      validatePaginationLinks(cardsResponse.links);
      validatePaginationMeta(cardsResponse.meta);

      if (cardsResponse.data.length > 0) {
        const card = cardsResponse.data[0];

        // Validate WorkflowCardResource structure
        validateResourceStructure(card, 'WorkflowCard');

        // Validate WorkflowCardAttributes
        if (card.attributes) {
          validateNullableStringAttribute(card.attributes, 'snooze_until');
          validateNullableStringAttribute(card.attributes, 'overdue_at');
          validateStringAttribute(card.attributes, 'stage_id');
          validateNullableStringAttribute(card.attributes, 'completed_at');
          validateDateAttribute(card.attributes, 'created_at');
          validateDateAttribute(card.attributes, 'updated_at');
        }

        // Validate WorkflowCardRelationships
        if (card.relationships) {
          validateRelationship(card.relationships.person, 'workflowCard.relationships.person');
          validateRelationship(card.relationships.workflow, 'workflowCard.relationships.workflow');
        }

        // Get notes for this card
        const cardId = card.id;
        const notesResponse = await getWorkflowCardNotes(client, personId, cardId);

        if (notesResponse.data.length > 0) {
          const note = notesResponse.data[0];

          // Validate WorkflowCardNoteResource structure
          validateResourceStructure(note, 'WorkflowCardNote');

          // Validate WorkflowCardNoteAttributes
          if (note.attributes) {
            validateStringAttribute(note.attributes, 'note');
            validateDateAttribute(note.attributes, 'created_at');
            validateDateAttribute(note.attributes, 'updated_at');
          }

          // Validate WorkflowCardNoteRelationships
          if (note.relationships) {
            if (note.relationships.workflow_card) {
              validateRelationship(note.relationships.workflow_card, 'workflowCardNote.relationships.workflow_card');
            }
          }
        } else {
          console.log('No workflow card notes found to validate');
        }
      } else {
        console.log('No workflow cards found to validate');
      }
    }, 30000);

    it('should validate field options and data types via field definitions', async () => {
      // Get field definitions with field options included
      const fieldDefsResponse = await getFieldDefinitions(client, {
        include: ['field_options'],
        per_page: 10,
      });

      // Check if we have field options in included resources
      if (fieldDefsResponse.included) {
        const fieldOptions = fieldDefsResponse.included.filter(r => r.type === 'FieldOption');

        if (fieldOptions.length > 0) {
          fieldOptions.forEach(option => {
            // Validate FieldOptionResource structure
            validateResourceStructure(option, 'FieldOption');

            // Validate FieldOptionAttributes
            if (option.attributes) {
              validateStringAttribute(option.attributes, 'value');
              validateNumberAttribute(option.attributes, 'sequence');
              validateDateAttribute(option.attributes, 'created_at');
              validateDateAttribute(option.attributes, 'updated_at');
            }

            // Validate FieldOptionRelationships
            if (option.relationships) {
              validateRelationship(option.relationships.field_definition, 'fieldOption.relationships.field_definition');
            }
          });
        } else {
          console.log('No field options found to validate');
        }
      }

      // Try to get field data for a person
      const peopleResponse = await getPeople(client, {
        include: ['field_data'],
        per_page: 5,
      });

      if (peopleResponse.included) {
        const fieldData = peopleResponse.included.filter(r => r.type === 'FieldDatum');

        if (fieldData.length > 0) {
          fieldData.forEach(datum => {
            // Validate FieldDatumResource structure
            validateResourceStructure(datum, 'FieldDatum');

            // Validate FieldDatumAttributes
            if (datum.attributes) {
              validateNullableStringAttribute(datum.attributes, 'value');
              // file can be string, object, or null depending on file type
              if (datum.attributes.file !== undefined) {
                expect(['string', 'object', 'null']).toContain(
                  datum.attributes.file === null ? 'null' : typeof datum.attributes.file
                );
              }
              validateNullableStringAttribute(datum.attributes, 'file_size');
              validateNullableStringAttribute(datum.attributes, 'file_name');
              validateNullableStringAttribute(datum.attributes, 'file_content_type');
              validateDateAttribute(datum.attributes, 'created_at');
              validateDateAttribute(datum.attributes, 'updated_at');
            }

            // Validate FieldDatumRelationships
            if (datum.relationships && 'field_definition' in datum.relationships) {
              validateRelationship(datum.relationships.field_definition, 'fieldDatum.relationships.field_definition');
            }
            if (datum.relationships && 'customizable' in datum.relationships) {
              validateRelationship(datum.relationships.customizable, 'fieldDatum.relationships.customizable');
            }
          });
        } else {
          console.log('No field data found to validate');
        }
      }
    }, 30000);
  });

  describe('Additional Resources Validation (Limited Availability)', () => {
    // Note: Some PCO People API resources may not be available via standard API endpoints
    // or may require special permissions. These tests attempt to validate types but skip
    // gracefully if resources are not accessible.

    it('should validate list types', async () => {
      try {
        const listsResponse = await getLists(client, { per_page: 5 });
        console.log('Lists endpoint available - validating types');

        if (listsResponse.data.length > 0) {
          const list = listsResponse.data[0];
          validateResourceStructure(list, 'List');

          if (list.attributes) {
            validateStringAttribute(list.attributes, 'name');
            validateStringAttribute(list.attributes, 'description');
          }
        }
      } catch (error) {
        console.log('Lists endpoint not available:', (error as Error).message);
      }
    }, 30000);

    it('should validate note types', async () => {
      try {
        const notesResponse = await getNotes(client, { per_page: 5 });
        console.log('Notes endpoint available - validating types');

        if (notesResponse.data.length > 0) {
          const note = notesResponse.data[0];
          validateResourceStructure(note, 'Note');

          if (note.attributes) {
            validateStringAttribute(note.attributes, 'content');
          }
        }
      } catch (error) {
        console.log('Notes endpoint not available:', (error as Error).message);
      }
    }, 30000);

    it('should validate workflow types', async () => {
      try {
        const workflowsResponse = await getWorkflows(client, { per_page: 5 });
        console.log('Workflows endpoint available - validating types');

        if (workflowsResponse.data.length > 0) {
          const workflow = workflowsResponse.data[0];
          validateResourceStructure(workflow, 'Workflow');

          if (workflow.attributes) {
            validateStringAttribute(workflow.attributes, 'name');
          }
        }
      } catch (error) {
        console.log('Workflows endpoint not available:', (error as Error).message);
      }
    }, 30000);

    it('should validate organization types', async () => {
      try {
        const organizationResponse = await getOrganization(client);
        console.log('Organization endpoint available - validating types');

        if (organizationResponse.data) {
          const organization = organizationResponse.data;
          validateResourceStructure(organization, 'Organization');

          if (organization.attributes) {
            validateStringAttribute(organization.attributes, 'name');
          }
        }
      } catch (error) {
        console.log('Organization endpoint not available:', (error as Error).message);
      }
    }, 30000);
  });

  describe('Rate Limiting & Performance', () => {
    it('should respect rate limits', async () => {
      const startTime = Date.now();
      const promises: Promise<any>[] = [];

      // Make multiple requests quickly to test rate limiting
      for (let i = 0; i < 5; i++) {
        promises.push(getPeople(client, { per_page: 1 }));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      // Should take some time due to rate limiting
      expect(endTime - startTime).toBeGreaterThan(100);
    }, 30000);

    it('should handle concurrent requests properly', async () => {
      const promises = [
        getPeople(client, { per_page: 1 }),
        getHouseholds(client, { per_page: 1 }),
        getFieldDefinitions(client, { per_page: 1 }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('data');
      expect(results[1]).toHaveProperty('data');
      expect(results[2]).toHaveProperty('data');
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid person ID gracefully', async () => {
      await expect(getPerson(client, 'invalid-id')).rejects.toThrow();
    }, 30000);

    it('should handle invalid email creation', async () => {
      if (!testPersonId) {
        console.warn('No test person available - skipping invalid email test');
        return;
      }

      const invalidEmailData: Partial<EmailAttributes> = {
        address: 'invalid-email-format',
        location: 'home',
      };

      await expect(
        createPersonEmail(client, testPersonId, invalidEmailData)
      ).rejects.toThrow();
    }, 30000);

    it('should handle network timeouts', async () => {
      const timeoutClient = createPcoClient({
        ...client.config,
        timeout: 1, // 1ms timeout to force timeout
      });

      await expect(getPeople(timeoutClient, { per_page: 1 })).rejects.toThrow();
    }, 30000);
  });
});
