/**
 * v2.0.0 Households Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    HouseholdResource,
    HouseholdAttributes
} from '../types';

export interface HouseholdListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class HouseholdsModule extends BaseModule {
    /**
     * Get all households
     */
    async getAll(options: HouseholdListOptions = {}): Promise<{ data: HouseholdResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<HouseholdResource>('/households', params);
    }

    /**
     * Get all households across all pages
     */
    async getAllPagesPaginated(options: HouseholdListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<HouseholdResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<HouseholdResource>('/households', params, paginationOptions);
    }

    /**
     * Get a single household by ID
     */
    async getById(id: string, include?: string[]): Promise<HouseholdResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<HouseholdResource>(`/households/${id}`, params);
    }

    /**
     * Create a household
     */
    async create(data: HouseholdAttributes): Promise<HouseholdResource> {
        return this.createResource<HouseholdResource>('/households', data);
    }

    /**
     * Update a household
     */
    async update(id: string, data: Partial<HouseholdAttributes>): Promise<HouseholdResource> {
        return this.updateResource<HouseholdResource>(`/households/${id}`, data);
    }

    /**
     * Delete a household
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/households/${id}`);
    }
}
