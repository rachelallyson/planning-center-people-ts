/**
 * v2.0.0 Lists Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    ListResource,
    ListAttributes,
    ListCategoryResource,
    ListCategoryAttributes,
    PersonResource,
} from '../types';

export interface ListsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class ListsModule extends BaseModule {
    /**
     * Get all lists
     */
    async getAll(options: ListsListOptions = {}): Promise<{ data: ListResource[]; meta?: any; links?: any }> {
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

        return this.getList<ListResource>('/lists', params);
    }

    /**
     * Get all lists across all pages
     */
    async getAllPagesPaginated(options: ListsListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<ListResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<ListResource>('/lists', params, paginationOptions);
    }

    /**
     * Get a single list by ID
     */
    async getById(id: string, include?: string[]): Promise<ListResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<ListResource>(`/lists/${id}`, params);
    }


    /**
     * Get all list categories
     */
    async getListCategories(): Promise<{ data: ListCategoryResource[]; meta?: any; links?: any }> {
        return this.getList<ListCategoryResource>('/list_categories');
    }

    /**
     * Get a single list category by ID
     */
    async getListCategoryById(id: string): Promise<ListCategoryResource> {
        return this.getSingle<ListCategoryResource>(`/list_categories/${id}`);
    }

    /**
     * Create a new list category
     */
    async createListCategory(data: ListCategoryAttributes): Promise<ListCategoryResource> {
        return this.createResource<ListCategoryResource>('/list_categories', data);
    }

    /**
     * Update an existing list category
     */
    async updateListCategory(id: string, data: Partial<ListCategoryAttributes>): Promise<ListCategoryResource> {
        return this.updateResource<ListCategoryResource>(`/list_categories/${id}`, data);
    }

    /**
     * Delete a list category
     */
    async deleteListCategory(id: string): Promise<void> {
        return this.deleteResource(`/list_categories/${id}`);
    }

    /**
     * Get people in a list (via the people relationship)
     */
    async getPeople(listId: string): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        return this.getList<PersonResource>(`/lists/${listId}/people`);
    }
}
