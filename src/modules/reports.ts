import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    ReportResource,
    ReportAttributes,
    ReportsList,
    PersonResource,
} from '../types';

/**
 * Reports module for managing report-related operations
 */
export class ReportsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all reports
     */
    async getAll(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<ReportsList> {
        return this.getList<ReportResource>('/reports', params) as Promise<ReportsList>;
    }

    /**
     * Get a specific report by ID
     */
    async getById(id: string, include?: string[]): Promise<ReportResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }
        return this.getSingle<ReportResource>(`/reports/${id}`, params);
    }

    /**
     * Create a new report
     */
    async create(data: ReportAttributes): Promise<ReportResource> {
        return this.createResource<ReportResource>('/reports', data);
    }

    /**
     * Update an existing report
     */
    async update(id: string, data: Partial<ReportAttributes>): Promise<ReportResource> {
        return this.updateResource<ReportResource>(`/reports/${id}`, data);
    }

    /**
     * Delete a report
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/reports/${id}`);
    }

    /**
     * Get the person who created a report
     */
    async getCreatedBy(reportId: string): Promise<PersonResource> {
        return this.getSingle<PersonResource>(`/reports/${reportId}/created_by`);
    }

    /**
     * Get the person who last updated a report
     */
    async getUpdatedBy(reportId: string): Promise<PersonResource> {
        return this.getSingle<PersonResource>(`/reports/${reportId}/updated_by`);
    }

    /**
     * Get all reports with pagination support
     */
    async getAllPagesPaginated(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
    }, paginationOptions?: PaginationOptions): Promise<PaginationResult<ReportResource>> {
        const queryParams: Record<string, any> = {};

        if (params?.where) {
            Object.entries(params.where).forEach(([key, value]) => {
                queryParams[`where[${key}]`] = value;
            });
        }

        if (params?.include) {
            queryParams.include = params.include.join(',');
        }

        if (params?.per_page) {
            queryParams.per_page = params.per_page;
        }

        return this.getAllPages<ReportResource>('/reports', queryParams, paginationOptions);
    }
}
