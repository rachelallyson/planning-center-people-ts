import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    ServiceTimeResource,
    ServiceTimeAttributes,
    ServiceTimesList,
} from '../types';

/**
 * ServiceTime module for managing service time-related operations
 * ServiceTimes are campus-scoped resources
 */
export class ServiceTimeModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all service times for a specific campus
     */
    async getAll(campusId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<ServiceTimesList> {
        return this.getList<ServiceTimeResource>(`/campuses/${campusId}/service_times`, params) as Promise<ServiceTimesList>;
    }

    /**
     * Get a specific service time by ID for a campus
     */
    async getById(campusId: string, id: string, include?: string[]): Promise<ServiceTimeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }
        return this.getSingle<ServiceTimeResource>(`/campuses/${campusId}/service_times/${id}`, params);
    }

    /**
     * Create a new service time for a campus
     */
    async create(campusId: string, data: ServiceTimeAttributes): Promise<ServiceTimeResource> {
        return this.createResource<ServiceTimeResource>(`/campuses/${campusId}/service_times`, data);
    }

    /**
     * Update an existing service time for a campus
     */
    async update(campusId: string, id: string, data: Partial<ServiceTimeAttributes>): Promise<ServiceTimeResource> {
        return this.updateResource<ServiceTimeResource>(`/campuses/${campusId}/service_times/${id}`, data);
    }

    /**
     * Delete a service time for a campus
     */
    async delete(campusId: string, id: string): Promise<void> {
        return this.deleteResource(`/campuses/${campusId}/service_times/${id}`);
    }

    /**
     * Get all service times for a campus with pagination support
     */
    async getAllPagesPaginated(campusId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
    }, paginationOptions?: PaginationOptions): Promise<PaginationResult<ServiceTimeResource>> {
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

        return this.getAllPages<ServiceTimeResource>(`/campuses/${campusId}/service_times`, queryParams, paginationOptions);
    }
}
