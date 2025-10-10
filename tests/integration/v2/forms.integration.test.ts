import { PcoClient, FormResource, FormSubmissionResource } from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

describe('v2.3.0 Forms API Integration Tests', () => {
    let client: PcoClient;
    const testFormId = '147102';

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    it('should get all forms', async () => {
        const forms = await client.forms.getAll();
        expect(forms).toBeDefined();
        expect(Array.isArray(forms.data)).toBe(true);

        if (forms.data.length > 0) {
            const form = forms.data[0];
            expect(form.type).toBe('Form');
            expect(form.id).toBeTruthy();
            expect(form.attributes).toBeDefined();
        }
    }, 30000);

    it('should get form by ID', async () => {
        const form = await client.forms.getById(testFormId);
        expect(form).toBeDefined();
        expect(form.type).toBe('Form');
        expect(form.id).toBe(testFormId);
        expect(form.attributes).toBeDefined();
    }, 30000);

    it('should get form by ID with includes', async () => {
        const form = await client.forms.getById(testFormId, ['form_category']);
        expect(form).toBeDefined();
        expect(form.type).toBe('Form');
        expect(form.id).toBe(testFormId);
    }, 30000);

    it('should get form category for a form', async () => {
        const formCategory = await client.forms.getFormCategory(testFormId);
        expect(formCategory).toBeDefined();
        expect(formCategory.type).toBe('FormCategory');
        expect(formCategory.attributes).toBeDefined();
    }, 30000);

    it('should get form fields for a form', async () => {
        const formFields = await client.forms.getFormFields(testFormId);
        expect(formFields).toBeDefined();
        expect(Array.isArray(formFields.data)).toBe(true);
    }, 30000);

    it('should get form field options for a form field', async () => {
        // First get form fields to find a field ID
        const formFields = await client.forms.getFormFields(testFormId);
        const fieldId = formFields.data[0].id || '';
        const formFieldOptions = await client.forms.getFormFieldOptions(testFormId, fieldId);
        expect(formFieldOptions).toBeDefined();
        expect(Array.isArray(formFieldOptions.data)).toBe(true);
    }, 30000);

    it('should get form submissions for a form', async () => {
        const formSubmissions = await client.forms.getFormSubmissions(testFormId);
        expect(formSubmissions).toBeDefined();
        expect(Array.isArray(formSubmissions.data)).toBe(true);

        const submission = formSubmissions.data[0];
        expect(submission.type).toBe('FormSubmission');
        expect(submission.id).toBeTruthy();
        expect(submission.attributes).toBeDefined();
    }, 30000);

    it('should get form submission by ID', async () => {
        // First get form submissions to find a submission ID
        const formSubmissions = await client.forms.getFormSubmissions(testFormId);
        const submissionId = formSubmissions.data[0].id || '';
        const formSubmission = await client.forms.getFormSubmissionById(testFormId, submissionId);
        expect(formSubmission).toBeDefined();
        expect(formSubmission.type).toBe('FormSubmission');
        expect(formSubmission.id).toBe(submissionId);
    }, 120000);

    it('should get form submission values for a form submission', async () => {
        // First get form submissions to find a submission ID
        const formSubmissions = await client.forms.getFormSubmissions(testFormId);
        const submissionId = formSubmissions.data[0].id || '';
        const formSubmissionValues = await client.forms.getFormSubmissionValues(testFormId, submissionId);
        expect(formSubmissionValues).toBeDefined();
        expect(Array.isArray(formSubmissionValues.data)).toBe(true);
    }, 60000);

    it('should handle invalid form ID gracefully', async () => {
        const invalidFormId = 'invalid-form-id';

        await expect(client.forms.getById(invalidFormId)).rejects.toThrow();
        await expect(client.forms.getFormCategory(invalidFormId)).rejects.toThrow();
        await expect(client.forms.getFormFields(invalidFormId)).rejects.toThrow();
        await expect(client.forms.getFormSubmissions(invalidFormId)).rejects.toThrow();
    }, 60000);

    it('should handle invalid form submission ID gracefully', async () => {
        const invalidSubmissionId = 'invalid-submission-id';

        await expect(client.forms.getFormSubmissionById(testFormId, invalidSubmissionId)).rejects.toThrow();
        await expect(client.forms.getFormSubmissionValues(testFormId, invalidSubmissionId)).rejects.toThrow();
    }, 30000);

    it('should handle forms with missing data gracefully', async () => {
        // Test that the API handles forms with missing fields/submissions gracefully
        const forms = await client.forms.getAll();
        expect(forms).toBeDefined();
        expect(Array.isArray(forms.data)).toBe(true);

        // Test a few forms to ensure the API doesn't crash
        for (let i = 0; i < Math.min(3, forms.data.length); i++) {
            const form = forms.data[i];
            await client.forms.getFormFields(form.id || '');
            await client.forms.getFormSubmissions(form.id || '');
        }
    }, 30000);
});
