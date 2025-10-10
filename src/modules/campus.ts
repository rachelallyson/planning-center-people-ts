import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    CampusResource,
    CampusAttributes,
    CampusesList,
    CampusSingle,
} from '../types';

/**
 * Campus module for managing campus-related operations
 */
export class CampusModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all campuses
     */
    async getAll(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<CampusesList> {
        return this.getList<CampusResource>('/campuses', params) as Promise<CampusesList>;
    }

    /**
     * Get a specific campus by ID
     */
    async getById(id: string, include?: string[]): Promise<CampusResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<CampusResource>(`/campuses/${id}`, params);
    }

    /**
     * Create a new campus
     */
    async create(data: CampusAttributes): Promise<CampusResource> {
        return this.createResource<CampusResource>('/campuses', data);
    }

    /**
     * Update an existing campus
     */
    async update(id: string, data: Partial<CampusAttributes>): Promise<CampusResource> {
        return this.updateResource<CampusResource>(`/campuses/${id}`, data);
    }

    /**
     * Delete a campus
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/campuses/${id}`);
    }

    /**
     * Get lists for a specific campus
     */
    async getLists(campusId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<any> {
        return this.getList(`/campuses/${campusId}/lists`, params);
    }

    /**
     * Get service times for a specific campus
     */
    async getServiceTimes(campusId: string, params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<any> {
        return this.getList(`/campuses/${campusId}/service_times`, params);
    }

    /**
     * Get all campuses with pagination support
     */
    async getAllPagesPaginated(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
    }, paginationOptions?: PaginationOptions): Promise<PaginationResult<CampusResource>> {
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

        return this.getAllPages<CampusResource>('/campuses', queryParams, paginationOptions);
    }
}
