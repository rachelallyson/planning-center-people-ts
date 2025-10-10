import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type {
    FormResource,
    FormAttributes,
    FormsList,
    FormCategoryResource,
    FormFieldResource,
    FormFieldOptionResource,
    FormSubmissionResource,
    FormSubmissionValueResource,
} from '../types';

/**
 * Forms module for managing form-related operations
 * Most operations are read-only based on API documentation
 */
export class FormsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all forms
     */
    async getAll(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<FormsList> {
        return this.getList<FormResource>('/forms', params) as Promise<FormsList>;
    }

    /**
     * Get a specific form by ID
     */
    async getById(id: string, include?: string[]): Promise<FormResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }
        return this.getSingle<FormResource>(`/forms/${id}`, params);
    }

    /**
     * Get form category for a specific form
     */
    async getFormCategory(formId: string): Promise<FormCategoryResource> {
        return this.getSingle<FormCategoryResource>(`/forms/${formId}/category`);
    }

    /**
     * Get form fields for a specific form
     */
    async getFormFields(formId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<{ data: FormFieldResource[] }> {
        const result = await this.getList<FormFieldResource>(`/forms/${formId}/fields`, params);
        return { data: result.data };
    }

    /**
     * Get form field options for a specific form field
     * Note: This requires the formId to get field options
     */
    async getFormFieldOptions(formId: string, formFieldId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<{ data: FormFieldOptionResource[] }> {
        const result = await this.getList<FormFieldOptionResource>(`/forms/${formId}/fields/${formFieldId}/options`, params);
        return { data: result.data };
    }

    /**
     * Get form submissions for a specific form
     */
    async getFormSubmissions(formId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<{ data: FormSubmissionResource[] }> {
        const result = await this.getList<FormSubmissionResource>(`/forms/${formId}/form_submissions`, params);
        return { data: result.data };
    }

    /**
     * Get a specific form submission by ID
     * Note: This requires the formId to get the submission
     */
    async getFormSubmissionById(formId: string, formSubmissionId: string, include?: string[]): Promise<FormSubmissionResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }
        return this.getSingle<FormSubmissionResource>(`/forms/${formId}/form_submissions/${formSubmissionId}`, params);
    }

    /**
     * Get form submission values for a specific form submission
     * Note: This requires the formId to get submission values
     */
    async getFormSubmissionValues(formId: string, formSubmissionId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<{ data: FormSubmissionValueResource[] }> {
        const result = await this.getList<FormSubmissionValueResource>(`/forms/${formId}/form_submissions/${formSubmissionId}/form_submission_values`, params);
        return { data: result.data };
    }
}
