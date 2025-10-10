/**
 * People Workflows API Integration Tests
 * 
 * Tests for src/people/workflows.ts functions:
 * - getWorkflowCardNotes, createWorkflowCardNote, getWorkflowCards, createWorkflowCard,
 *   getWorkflows, getWorkflow
 * 
 * To run: npm run test:integration:people-workflows
 */

import {
    createPcoClient,
    getWorkflowCardNotes,
    createWorkflowCardNote,
    getWorkflowCards,
    createWorkflowCard,
    getWorkflows,
    getWorkflow,
    createPerson,
    deletePerson,
    type PcoClientState,
    type PersonAttributes,
    type WorkflowCardNoteAttributes,
} from '../../src';
import {
    validateResourceStructure,
    validateNullableStringAttribute,
    validateStringAttribute,
    validateDateAttribute,
    validateRelationship,
    validatePaginationLinks,
    validatePaginationMeta,
} from '../type-validators';

// Test configuration
const TEST_PREFIX = 'TEST_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('People Workflows API Integration Tests', () => {
    let client: PcoClientState;
    let testPersonId = ''
    let testWorkflowId = ''
    let testWorkflowCardId = ''
    let testWorkflowCardNoteId = ''

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

        // Create test person for workflow cards
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_Workflow_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const personResponse = await createPerson(client, personData);
        testPersonId = personResponse.data?.id || '';

        // Test person created for workflow testing

        // Get a workflow for testing and create a workflow card
        const workflowsResponse = await getWorkflows(client, { per_page: 1 });
        expect(workflowsResponse.data.length).toBeGreaterThan(0);
        testWorkflowId = workflowsResponse.data[0].id;

        // Create a workflow card for the test person
        expect(testPersonId).toBeDefined();
        const workflowCard = await createWorkflowCard(client, testWorkflowId, testPersonId);
        testWorkflowCardId = workflowCard.data?.id || '';
    }, 30000);

    afterAll(async () => {
        // Clean up test person (this will cascade delete all workflow cards and notes)
        if (testPersonId) {
            await deletePerson(client, testPersonId);
            testPersonId = '';
        }
    }, 30000);

    describe('Workflow Operations', () => {
        it('should get workflows list', async () => {

            const response = await getWorkflows(client, { per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const workflow = response.data[0];

            // Validate WorkflowResource structure
            validateResourceStructure(workflow, 'Workflow');

            // Validate WorkflowAttributes

            validateStringAttribute(workflow.attributes, 'name');
            validateDateAttribute(workflow.attributes, 'created_at');
            validateDateAttribute(workflow.attributes, 'updated_at');

            validateRelationship(workflow.relationships?.workflow_category);
            validateRelationship(workflow.relationships?.campus);

        }, 30000);

        it('should get single workflow by ID', async () => {
            expect(testWorkflowId).toBeDefined();


            const workflow = await getWorkflow(client, testWorkflowId, { include: ['workflow_cards'] });

            expect(workflow.data).toBeDefined();
            expect(workflow.data?.type).toBe('Workflow');
            expect(workflow.data?.id).toBe(testWorkflowId);
            expect(workflow.data?.attributes).toBeDefined();

            // Validate WorkflowResource structure

            validateResourceStructure(workflow.data, 'Workflow');

            // Validate WorkflowAttributes

            validateStringAttribute(workflow.data?.attributes, 'name');
            validateDateAttribute(workflow.data?.attributes, 'created_at');
            validateDateAttribute(workflow.data?.attributes, 'updated_at');

            // Check if included workflow cards are present
            const cards = workflow.included?.filter(r => r.type === 'WorkflowCard');
            cards?.forEach(card => {
                validateResourceStructure(card, 'WorkflowCard');
            });



        }, 30000);
    });

    describe('Workflow Card Operations', () => {
        it('should get workflow cards for person', async () => {
            const cardsResponse = await getWorkflowCards(client, testPersonId);

            expect(cardsResponse).toHaveProperty('data');
            expect(Array.isArray(cardsResponse.data)).toBe(true);

            // Validate pagination
            validatePaginationLinks(cardsResponse.links);
            validatePaginationMeta(cardsResponse.meta);

            expect(cardsResponse.data.length).toBeGreaterThan(0);
            const card = cardsResponse.data[0];

            // Validate WorkflowCardResource structure
            validateResourceStructure(card, 'WorkflowCard');

            // Validate WorkflowCardAttributes
            validateNullableStringAttribute(card.attributes, 'snooze_until');
            validateNullableStringAttribute(card.attributes, 'overdue_at');
            validateStringAttribute(card.attributes, 'stage_id');
            validateNullableStringAttribute(card.attributes, 'completed_at');
            validateDateAttribute(card.attributes, 'created_at');
            validateDateAttribute(card.attributes, 'updated_at');


            // Validate WorkflowCardRelationships
            validateRelationship(card.relationships?.person);
            validateRelationship(card.relationships?.workflow);

        }, 30000);

        it('should create workflow card', async () => {
            expect(testPersonId).toBeDefined();
            expect(testWorkflowId).toBeDefined();


            const workflowCard = await createWorkflowCard(client, testWorkflowId, testPersonId);

            expect(workflowCard.data).toBeDefined();
            expect(workflowCard.data?.type).toBe('WorkflowCard');
            expect(workflowCard.data?.attributes).toBeDefined();

            testWorkflowCardId = workflowCard.data?.id || '';

            // Validate WorkflowCardResource structure
            validateResourceStructure(workflowCard.data, 'WorkflowCard');

            // Validate WorkflowCardAttributes

            validateNullableStringAttribute(workflowCard.data?.attributes, 'snooze_until');
            validateNullableStringAttribute(workflowCard.data?.attributes, 'overdue_at');
            validateStringAttribute(workflowCard.data?.attributes, 'stage_id');
            validateNullableStringAttribute(workflowCard.data?.attributes, 'completed_at');
            validateDateAttribute(workflowCard.data?.attributes, 'created_at');
            validateDateAttribute(workflowCard.data?.attributes, 'updated_at');

            // Validate WorkflowCardRelationships
            validateRelationship(workflowCard.data?.relationships?.person);
            validateRelationship(workflowCard.data?.relationships?.workflow);

        }, 30000);
    });

    describe('Workflow Card Note Operations', () => {
        it('should get and create workflow card notes', async () => {
            // Use the workflow card created in setup
            expect(testWorkflowCardId).toBeDefined();
            const cardId = testWorkflowCardId || '';

            // Create a note for this card first
            const timestamp = Date.now();
            const noteData: Partial<WorkflowCardNoteAttributes> = {
                note: `Test workflow card note ${timestamp}`,
            };

            const createResponse = await createWorkflowCardNote(client, testPersonId, cardId, noteData);
            expect(createResponse.data).toBeDefined();

            // Validate WorkflowCardNoteResource structure
            validateResourceStructure(createResponse.data, 'WorkflowCardNote');

            // Validate WorkflowCardNoteAttributes
            validateStringAttribute(createResponse.data?.attributes, 'note');

            // Validate WorkflowCardNoteRelationships
            if (createResponse.data?.relationships) {
                expect(createResponse.data.relationships).toHaveProperty('note_category');
            }


            // Now get notes for this card to verify it was created
            const notesResponse = await getWorkflowCardNotes(client, testPersonId, cardId);
            expect(notesResponse).toHaveProperty('data');
            expect(Array.isArray(notesResponse.data)).toBe(true);
            expect(notesResponse.data.length).toBeGreaterThan(0);

        }, 30000);
    });
});
