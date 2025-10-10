/**
 * v2.0.0 Fields API Integration Tests
 * 
 * Tests for the new fields API:
 * - client.fields.getAllFieldDefinitions() with caching
 * - client.fields.setPersonFieldBySlug() with type-safe operations
 * - Field definition caching and validation
 * 
 * To run: npm run test:integration:v2:fields
 */

import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

// Test configuration
const TEST_PREFIX = 'TEST_V2_FIELDS_2025';

describe('v2.0.0 Fields API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId = '';

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Add fields-specific event handlers
        client.on('error', (event) => {
            console.error('Fields Error:', (event as any).error.message);
        });
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            await client.people.delete(testPersonId);
            testPersonId = '';
        }
    }, 30000);

    describe('Field Definitions', () => {
        it('should get all field definitions with caching', async () => {
            const fieldDefs = await client.fields.getAllFieldDefinitions();

            expect(Array.isArray(fieldDefs)).toBe(true);
            expect(fieldDefs.length).toBeGreaterThan(0);

            // Validate field definition structure
            const fieldDef = fieldDefs[0];
            expect(fieldDef).toHaveProperty('type', 'FieldDefinition');
            expect(fieldDef).toHaveProperty('id');
            expect(fieldDef).toHaveProperty('attributes');
            expect(fieldDef.attributes).toHaveProperty('name');
            expect(fieldDef.attributes).toHaveProperty('slug');
            expect(fieldDef.attributes).toHaveProperty('data_type');

            // Test caching - second call should be faster
            const startTime = Date.now();
            const cachedFieldDefs = await client.fields.getAllFieldDefinitions();
            const endTime = Date.now();

            expect(cachedFieldDefs).toEqual(fieldDefs);
            expect(endTime - startTime).toBeLessThan(1000); // Should be much faster due to caching
        }, 30000);

        it('should get field definition by ID', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs[0];
            const fieldDef = await client.fields.getFieldDefinition(firstFieldDef.id);

            expect(fieldDef).toBeDefined();
            expect(fieldDef.id).toBe(firstFieldDef.id);
            expect(fieldDef.type).toBe('FieldDefinition');
            expect(fieldDef.attributes).toBeDefined();
        }, 30000);

        it('should get field definition by slug', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs[0];
            if (firstFieldDef.attributes?.slug) {
                const fieldDef = await client.fields.getFieldDefinitionBySlug(firstFieldDef.attributes.slug);

                expect(fieldDef).toBeDefined();
                expect(fieldDef?.id).toBe(firstFieldDef.id);
                expect(fieldDef?.attributes?.slug).toBe(firstFieldDef.attributes.slug);
            }
        }, 30000);

        it('should get field definition by name', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs[0];
            if (firstFieldDef.attributes?.name) {
                const fieldDef = await client.fields.getFieldDefinitionByName(firstFieldDef.attributes.name);

                expect(fieldDef).toBeDefined();
                expect(fieldDef?.id).toBe(firstFieldDef.id);
                expect(fieldDef?.attributes?.name).toBe(firstFieldDef.attributes.name);
            }
        }, 30000);
    });

    describe('Person Field Operations', () => {
        beforeEach(async () => {
            // Create a test person for field operations
            if (!testPersonId) {
                const timestamp = Date.now();
                const personData = {
                    first_name: `${TEST_PREFIX}_FieldTest_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };

                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.id || '';
                expect(testPersonId).toBeTruthy();
            }
        }, 90000);

        it('should set person field by field ID', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const textField = allFieldDefs.find(field =>
                field.attributes?.data_type === 'text' ||
                field.attributes?.data_type === 'string'
            );

            if (textField) {
                const testValue = `Test value ${Date.now()}`;
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    textField.id,
                    testValue
                );

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.attributes?.value).toBe(testValue);
            }
        }, 30000);

        it('should set person field by slug', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const textField = allFieldDefs.find(field =>
                (field.attributes?.data_type === 'text' ||
                    field.attributes?.data_type === 'string') &&
                field.attributes?.slug
            );

            if (textField && textField.attributes?.slug) {
                const testValue = `Test slug value ${Date.now()}`;
                const result = await client.fields.setPersonFieldBySlug(
                    testPersonId,
                    textField.attributes.slug,
                    testValue
                );

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.attributes?.value).toBe(testValue);
            }
        }, 30000);

        it('should set person field by name', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const textField = allFieldDefs.find(field =>
                (field.attributes?.data_type === 'text' ||
                    field.attributes?.data_type === 'string') &&
                field.attributes?.name
            );

            if (textField && textField.attributes?.name) {
                const testValue = `Test name value ${Date.now()}`;
                const result = await client.fields.setPersonFieldByName(
                    testPersonId,
                    textField.attributes.name,
                    testValue
                );

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.attributes?.value).toBe(testValue);
            }
        }, 60000);

        it('should handle field validation errors', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const requiredField = allFieldDefs.find(field =>
                field.attributes?.required === true
            );

            if (requiredField) {
                // Try to set an empty value for a required field
                await expect(
                    client.fields.setPersonFieldById(
                        testPersonId,
                        requiredField.id,
                        ''
                    )
                ).rejects.toThrow();
            }
        }, 30000);

        it('should handle invalid field ID gracefully', async () => {
            await expect(
                client.fields.setPersonFieldById(
                    testPersonId,
                    'invalid-field-id',
                    'test value'
                )
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid person ID gracefully', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs[0];
            await expect(
                client.fields.setPersonFieldById(
                    'invalid-person-id',
                    firstFieldDef.id,
                    'test value'
                )
            ).rejects.toThrow();
        }, 60000);
    });

    describe('Field Caching Performance', () => {
        it('should demonstrate field definition caching performance', async () => {
            // First call - should load from API
            const startTime1 = Date.now();
            const fieldDefs1 = await client.fields.getAllFieldDefinitions();
            const endTime1 = Date.now();
            const firstCallDuration = endTime1 - startTime1;

            // Second call - should use cache
            const startTime2 = Date.now();
            const fieldDefs2 = await client.fields.getAllFieldDefinitions();
            const endTime2 = Date.now();
            const secondCallDuration = endTime2 - startTime2;

            expect(fieldDefs1).toEqual(fieldDefs2);
            // Both calls should be fast, but second should be at least as fast as first
            // Allow for small timing variations (within 5ms)
            expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration + 5);
            expect(secondCallDuration).toBeLessThan(100); // Should be very fast from cache

            console.log(`First call: ${firstCallDuration}ms, Second call: ${secondCallDuration}ms`);
        }, 30000);

        it('should cache field lookups by slug and name', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            const testField = allFieldDefs[0];

            if (testField.attributes?.slug) {
                // First lookup by slug
                const startTime1 = Date.now();
                const fieldBySlug1 = await client.fields.getFieldDefinitionBySlug(testField.attributes.slug);
                const endTime1 = Date.now();

                // Second lookup by slug (should use cache)
                const startTime2 = Date.now();
                const fieldBySlug2 = await client.fields.getFieldDefinitionBySlug(testField.attributes.slug);
                const endTime2 = Date.now();

                expect(fieldBySlug1).toEqual(fieldBySlug2);
                expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1);
            }

            if (testField.attributes?.name) {
                // First lookup by name
                const startTime1 = Date.now();
                const fieldByName1 = await client.fields.getFieldDefinitionByName(testField.attributes.name);
                const endTime1 = Date.now();

                // Second lookup by name (should use cache)
                const startTime2 = Date.now();
                const fieldByName2 = await client.fields.getFieldDefinitionByName(testField.attributes.name);
                const endTime2 = Date.now();

                expect(fieldByName1).toEqual(fieldByName2);
                expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1);
            }
        }, 30000);
    });

    describe('Field Type Validation', () => {
        beforeEach(async () => {
            // Create a test person for field operations
            if (!testPersonId) {
                const timestamp = Date.now();
                const personData = {
                    first_name: `${TEST_PREFIX}_FieldTest_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };

                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.id || '';
                expect(testPersonId).toBeTruthy();
            }
        }, 90000);

        it('should validate different field types', async () => {
            expect(testPersonId).toBeTruthy();

            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.length).toBeGreaterThan(0);

            // Test different field types
            const textField = allFieldDefs.find(field =>
                field.attributes?.data_type === 'text'
            );
            const numberField = allFieldDefs.find(field =>
                field.attributes?.data_type === 'number'
            );
            const dateField = allFieldDefs.find(field =>
                field.attributes?.data_type === 'date'
            );

            if (textField) {
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    textField.id,
                    'Test text value'
                );
                expect(result.attributes?.value).toBe('Test text value');
            }

            if (numberField) {
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    numberField.id,
                    '123'
                );
                expect(result.attributes?.value).toBe('123');
            }

            if (dateField) {
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    dateField.id,
                    '2025-01-01'
                );
                // Date fields may be returned in different formats by the API
                expect(result.attributes?.value).toMatch(/2025-01-01|01\/01\/2025/);
            }
        }, 60000);
    });

    describe('File Upload Functionality', () => {
        it('should upload files to file fields', async () => {
            // Create a test person first
            const timestamp = Date.now();
            const personData = {
                first_name: `${TEST_PREFIX}_FileUpload_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const createResponse = await client.people.create(personData);
            const testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            try {
                // Get field definitions to find a file field
                const fieldDefs = await client.fields.getAllFieldDefinitions();
                const fileField = fieldDefs.find(field => field.attributes?.data_type === 'file');

                if (fileField) {
                    // Test with a simple text file that should work
                    const testFileUrl = 'https://www.w3.org/TR/2003/REC-PNG-20031110/iso_8859-1.txt';

                    const result = await client.fields.createPersonFieldData(
                        testPersonId,
                        fileField.id,
                        testFileUrl
                    );

                    // Verify the response structure
                    expect(result).toBeDefined();
                    expect(result.type).toBe('FieldDatum');
                    expect(result.id).toBeTruthy();

                    // For file fields, the file data is in the 'file' attribute, not 'value'
                    expect(result.attributes?.file).toBeTruthy();
                    expect(result.attributes?.file?.url).toBeTruthy();
                    expect(result.attributes?.file_name).toBe('iso_8859-1.txt');
                    expect(result.attributes?.file_content_type).toBe('text/plain');
                    expect(result.attributes?.file_size).toBeGreaterThan(0);

                    // Clean up the field data
                    await client.fields.deletePersonFieldData(testPersonId, result.id);
                } else {
                    console.log('No file field found for testing - skipping file upload test');
                }
            } finally {
                // Clean up test person
                await client.people.delete(testPersonId);
            }
        }, 60000);

        it('should handle HTML markup with file URLs', async () => {
            // Create a test person first
            const timestamp = Date.now();
            const personData = {
                first_name: `${TEST_PREFIX}_HTMLFile_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const createResponse = await client.people.create(personData);
            const testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            try {
                // Get field definitions to find a file field
                const fieldDefs = await client.fields.getAllFieldDefinitions();
                const fileField = fieldDefs.find(field => field.attributes?.data_type === 'file');

                if (fileField) {
                    // Test with HTML markup containing file URL
                    const htmlFileValue = '<a href="https://www.w3.org/TR/2003/REC-PNG-20031110/iso_8859-1.txt" download>View File</a>';

                    const result = await client.fields.createPersonFieldData(
                        testPersonId,
                        fileField.id,
                        htmlFileValue
                    );

                    // Verify the response structure
                    expect(result).toBeDefined();
                    expect(result.type).toBe('FieldDatum');
                    expect(result.id).toBeTruthy();

                    // For file fields, the file data is in the 'file' attribute, not 'value'
                    expect(result.attributes?.file).toBeTruthy();
                    expect(result.attributes?.file?.url).toBeTruthy();
                    expect(result.attributes?.file_name).toBeTruthy();
                    expect(result.attributes?.file_content_type).toBeTruthy();
                    expect(result.attributes?.file_size).toBeGreaterThan(0);

                    // Clean up the field data
                    await client.fields.deletePersonFieldData(testPersonId, result.id);
                } else {
                    console.log('No file field found for testing - skipping HTML file upload test');
                }
            } finally {
                // Clean up test person
                await client.people.delete(testPersonId);
            }
        }, 120000);

        it('should handle file upload errors gracefully', async () => {
            // Create a test person first
            const timestamp = Date.now();
            const personData = {
                first_name: `${TEST_PREFIX}_ErrorTest_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const createResponse = await client.people.create(personData);
            const testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            try {
                // Get field definitions to find a file field
                const fieldDefs = await client.fields.getAllFieldDefinitions();
                const fileField = fieldDefs.find(field => field.attributes?.data_type === 'file');

                if (fileField) {
                    // Test with an invalid file URL
                    const invalidFileUrl = 'https://invalid-domain-that-does-not-exist.com/file.txt';

                    await expect(
                        client.fields.createPersonFieldData(
                            testPersonId,
                            fileField.id,
                            invalidFileUrl
                        )
                    ).rejects.toThrow();
                } else {
                    console.log('No file field found for testing - skipping error handling test');
                }
            } finally {
                // Clean up test person
                await client.people.delete(testPersonId);
            }
        }, 60000);
    });
});
