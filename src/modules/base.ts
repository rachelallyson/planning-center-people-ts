/**
 * v2.0.0 Base Module Class
 */

import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type { ResourceObject } from '../types';

export abstract class BaseModule {
    protected httpClient: PcoHttpClient;
    protected paginationHelper: PaginationHelper;
    protected eventEmitter: PcoEventEmitter;

    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        this.httpClient = httpClient;
        this.paginationHelper = paginationHelper;
        this.eventEmitter = eventEmitter;
    }

    /**
     * Get a single resource
     */
    protected async getSingle<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.httpClient.request<{ data: T }>({
            method: 'GET',
            endpoint,
            params,
        });
        return response.data.data;
    }

    /**
     * Get a list of resources
     */
    protected async getList<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<{ data: T[]; meta?: any; links?: any }> {
        const response = await this.httpClient.request<{ data: T[]; meta?: any; links?: any }>({
            method: 'GET',
            endpoint,
            params,
        });
        return response.data;
    }

    /**
     * Create a resource
     */
    protected async createResource<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        data: any,
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.httpClient.request<{ data: T }>({
            method: 'POST',
            endpoint,
            data,
            params,
        });
        return response.data.data;
    }

    /**
     * Update a resource
     */
    protected async updateResource<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        data: any,
        params?: Record<string, any>
    ): Promise<T> {
        const response = await this.httpClient.request<{ data: T }>({
            method: 'PATCH',
            endpoint,
            data,
            params,
        });
        return response.data.data;
    }

    /**
     * Delete a resource
     */
    protected async deleteResource(endpoint: string, params?: Record<string, any>): Promise<void> {
        await this.httpClient.request({
            method: 'DELETE',
            endpoint,
            params,
        });
    }

    /**
     * Get all pages of a resource
     */
    protected async getAllPages<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params?: Record<string, any>,
        options?: PaginationOptions
    ): Promise<PaginationResult<T>> {
        return this.paginationHelper.getAllPages<T>(endpoint, params, options);
    }

    /**
     * Stream pages of a resource
     */
    protected async* streamPages<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params?: Record<string, any>,
        options?: PaginationOptions
    ): AsyncGenerator<T[], void, unknown> {
        yield* this.paginationHelper.streamPages<T>(endpoint, params, options);
    }
}
