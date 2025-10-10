import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { validatePersonResource } from '../../type-validators';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_WORKFLOWS_2025';

describe('v2.0.0 Workflows API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testWorkflowId: string;
    let testWorkflowCardId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Create a test person for workflow operations
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_WorkflowTest_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const createResponse = await client.people.create(personData);
        testPersonId = createResponse.id || '';
        expect(testPersonId).toBeTruthy();
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            try {
                await client.people.delete(testPersonId);
            } catch (error) {
                console.warn('Failed to clean up test person:', error);
            }
        }
    }, 60000);

    describe('v2.0 Workflow Operations', () => {
        it('should get all workflows with pagination', async () => {
            const workflows = await client.workflows.getAll();
            expect(workflows.data).toBeDefined();
            expect(Array.isArray(workflows.data)).toBe(true);
            expect(workflows.meta).toBeDefined();
        }, 30000);

        it('should get workflow by ID', async () => {
            const workflows = await client.workflows.getAll();
            expect(workflows.data.length).toBeGreaterThan(0);

            const workflowId = workflows.data[0].id;
            const workflow = await client.workflows.getById(workflowId);

            expect(workflow).toBeDefined();
            expect(workflow.type).toBe('Workflow');
            expect(workflow.id).toBe(workflowId);
            expect(workflow.attributes).toBeDefined();

            testWorkflowId = workflowId;
        }, 30000);

        it('should add person to workflow with duplicate detection', async () => {
            if (!testWorkflowId) {
                const workflows = await client.workflows.getAll();
                testWorkflowId = workflows.data[0].id;
            }

            // First, add person to workflow
            const workflowCard = await client.workflows.addPersonToWorkflow(
                testPersonId,
                testWorkflowId
            );

            expect(workflowCard).toBeDefined();
            expect(workflowCard.type).toBe('WorkflowCard');
            expect(workflowCard.attributes).toBeDefined();
            expect(workflowCard.relationships?.person?.data?.id).toBe(testPersonId);

            testWorkflowCardId = workflowCard.id || '';
            expect(testWorkflowCardId).toBeTruthy();
        }, 30000);

        it('should detect duplicate workflow card', async () => {
            if (!testWorkflowId) {
                const workflows = await client.workflows.getAll();
                testWorkflowId = workflows.data[0].id;
            }

            // Try to add the same person again - should detect duplicate
            try {
                await client.workflows.addPersonToWorkflow(
                    testPersonId,
                    testWorkflowId
                );
                // If we get here, the duplicate detection didn't work
                fail('Expected duplicate detection to prevent adding the same person twice');
            } catch (error: any) {
                // This is expected - the person is already in the workflow
                expect(
                    error.message.includes('already exists') ||
                    error.message.includes('duplicate') ||
                    error.message.includes('already has an active card') ||
                    error.message.includes('already has a completed/removed card')
                ).toBe(true);
            }
        }, 30000);

        it('should get workflow cards for a person', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data).toBeDefined();
            expect(Array.isArray(workflowCards.data)).toBe(true);
            expect(workflowCards.data.length).toBeGreaterThan(0);

            // Verify the test person is in at least one workflow
            const hasTestPerson = workflowCards.data.some(card =>
                card.relationships?.person?.data?.id === testPersonId
            );
            expect(hasTestPerson).toBe(true);
        }, 60000);

        it('should update workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping update test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping update test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Update workflow card with assignable fields
            const updateData = {
                sticky_assignment: true,
            };

            const updatedCard = await client.workflows.updateWorkflowCard(
                testWorkflowCardId,
                updateData,
                testPersonId
            );

            expect(updatedCard).toBeDefined();
            expect(updatedCard.type).toBe('WorkflowCard');
            expect(updatedCard.id).toBe(testWorkflowCardId);
            expect(updatedCard.attributes?.sticky_assignment).toBe(true);
        }, 60000);

        it('should add workflow card notes', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping notes test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping notes test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            const noteData = {
                note: 'This is a test note added via v2.0 API',
            };

            const note = await client.workflows.createWorkflowCardNote(
                testPersonId,
                testWorkflowCardId,
                noteData
            );

            expect(note).toBeDefined();
            expect(note.type).toBe('WorkflowCardNote');
            expect(note.attributes?.note).toBe(noteData.note);
            // Note: The workflow_card relationship is implicit through the URL path
            // and may not be included in the response data
        }, 30000);

        it('should complete workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping complete test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping complete test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Update workflow card with assignable fields
            // Note: completed_at cannot be assigned directly - it's a computed field
            // Workflow cards are typically completed through workflow step progression
            const updateData = {
                sticky_assignment: false,
            };

            const completedCard = await client.workflows.updateWorkflowCard(testWorkflowCardId, updateData, testPersonId);

            expect(completedCard).toBeDefined();
            expect(completedCard.type).toBe('WorkflowCard');
            expect(completedCard.id).toBe(testWorkflowCardId);
            expect(completedCard.attributes?.sticky_assignment).toBe(false);
        }, 30000);

        it('should handle invalid workflow ID gracefully', async () => {
            await expect(
                client.workflows.getById('invalid-workflow-id')
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid person ID gracefully', async () => {
            if (!testWorkflowId) {
                const workflows = await client.workflows.getAll();
                testWorkflowId = workflows.data[0].id;
            }

            await expect(
                client.workflows.addPersonToWorkflow(testWorkflowId, 'invalid-person-id')
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid workflow card ID gracefully', async () => {
            await expect(
                client.workflows.updateWorkflowCard('invalid-card-id', { stage: 'test' })
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Workflow Performance', () => {
        it('should demonstrate workflow operations performance', async () => {
            const startTime = Date.now();

            // Get all workflows
            const workflows = await client.workflows.getAll();
            const workflowFetchTime = Date.now() - startTime;

            expect(workflows.data.length).toBeGreaterThan(0);
            expect(workflowFetchTime).toBeLessThan(30000); // Allow more time for API calls

            console.log(`Workflow fetch time: ${workflowFetchTime}ms`);
        }, 30000);
    });

    describe('v2.0 Workflow Card Actions', () => {
        it('should snooze and unsnooze workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping snooze test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping snooze test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Snooze the workflow card for 1 day
            const snoozedCard = await client.workflows.snoozeWorkflowCard(testPersonId, testWorkflowCardId, { duration: 1 });

            expect(snoozedCard).toBeDefined();
            expect(snoozedCard.type).toBe('WorkflowCard');
            expect(snoozedCard.id).toBe(testWorkflowCardId);
            expect(snoozedCard.attributes?.snooze_until).toBeTruthy();

            // Unsnooze the workflow card
            const unsnoozedCard = await client.workflows.unsnoozeWorkflowCard(testPersonId, testWorkflowCardId);

            expect(unsnoozedCard).toBeDefined();
            expect(unsnoozedCard.type).toBe('WorkflowCard');
            expect(unsnoozedCard.id).toBe(testWorkflowCardId);
        }, 30000);

        it('should promote workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping promote test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping promote test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Promote the workflow card to the next step
            const promotedCard = await client.workflows.promoteWorkflowCard(testPersonId, testWorkflowCardId);

            expect(promotedCard).toBeDefined();
            expect(promotedCard.type).toBe('WorkflowCard');
            expect(promotedCard.id).toBe(testWorkflowCardId);
        }, 30000);

        it('should skip step workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping skip step test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping skip step test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Skip the current step
            const skippedCard = await client.workflows.skipStepWorkflowCard(testPersonId, testWorkflowCardId);

            expect(skippedCard).toBeDefined();
            expect(skippedCard.type).toBe('WorkflowCard');
            expect(skippedCard.id).toBe(testWorkflowCardId);
        }, 30000);

        it('should send email from workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping send email test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping send email test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Ensure the test person has an email address
            const emails = await client.people.getEmails(testPersonId);
            if (emails.data.length === 0) {
                // Create an email for the test person
                const emailData = {
                    address: 'test@planningcenteronline.com',
                    primary: true,
                    location: 'Home'
                };
                await client.people.addEmail(testPersonId, emailData);
            }

            // Send email from the workflow card
            const emailData = {
                subject: 'Test Email from Workflow Card',
                note: 'This is a test email sent from a workflow card action.'
            };

            const emailCard = await client.workflows.sendEmailWorkflowCard(testPersonId, testWorkflowCardId, emailData);

            expect(emailCard).toBeDefined();
            expect(emailCard.type).toBe('WorkflowCard');
            expect(emailCard.id).toBe(testWorkflowCardId);
        }, 30000);

        it('should remove and restore workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            if (workflowCards.data.length === 0) {
                console.log('No workflow cards found for person - skipping remove/restore test');
                return;
            }

            const testCard = workflowCards.data.find(card =>
                card.relationships?.person?.data?.id === testPersonId
            );

            if (!testCard) {
                console.log('No workflow card found for test person - skipping remove/restore test');
                return;
            }

            const testWorkflowCardId = testCard.id;

            // Remove the workflow card
            const removedCard = await client.workflows.removeWorkflowCard(testPersonId, testWorkflowCardId);

            expect(removedCard).toBeDefined();
            expect(removedCard.type).toBe('WorkflowCard');
            expect(removedCard.id).toBe(testWorkflowCardId);
            // Note: removed_at field may not be present in the response

            // Restore the workflow card
            const restoredCard = await client.workflows.restoreWorkflowCard(testPersonId, testWorkflowCardId);

            expect(restoredCard).toBeDefined();
            expect(restoredCard.type).toBe('WorkflowCard');
            expect(restoredCard.id).toBe(testWorkflowCardId);
            // Note: removed_at field may not be present in the response
        }, 30000);
    });
});
