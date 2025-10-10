/**
 * v2.0.0 Pagination Utilities
 */

import type { ResourceObject, Paginated } from '../types';
import type { PcoHttpClient } from './http';

export interface PaginationOptions {
    /** Maximum number of pages to fetch */
    maxPages?: number;
    /** Items per page */
    perPage?: number;
    /** Progress callback */
    onProgress?: (current: number, total: number) => void;
    /** Delay between requests in milliseconds */
    delay?: number;
}

export interface PaginationResult<T> {
    data: T[];
    totalCount: number;
    pagesFetched: number;
    duration: number;
}

export class PaginationHelper {
    constructor(private httpClient: PcoHttpClient) { }

    async getAllPages<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params: Record<string, any> = {},
        options: PaginationOptions = {}
    ): Promise<PaginationResult<T>> {
        // Ensure endpoint is a string
        if (typeof endpoint !== 'string') {
            throw new Error(`Expected endpoint to be a string, got ${typeof endpoint}`);
        }
        const {
            maxPages = 1000,
            perPage = 100,
            onProgress,
            delay = 50,
        } = options;

        const startTime = Date.now();
        const allData: T[] = [];
        let page = 1;
        let hasMore = true;
        let totalCount = 0;

        while (hasMore && page <= maxPages) {
            const response = await this.httpClient.request<Paginated<T>>({
                method: 'GET',
                endpoint,
                params: {
                    ...params,
                    page,
                    per_page: perPage,
                },
            });

            if (response.data.data && Array.isArray(response.data.data)) {
                allData.push(...response.data.data);
            }

            if (response.data.meta?.total_count) {
                totalCount = Number(response.data.meta.total_count) || 0;
            }

            hasMore = !!response.data.links?.next;
            page++;

            if (onProgress) {
                onProgress(allData.length, totalCount || allData.length);
            }

            // Add delay between requests to respect rate limits
            if (hasMore && delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return {
            data: allData,
            totalCount,
            pagesFetched: page - 1,
            duration: Date.now() - startTime,
        };
    }

    async getPage<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        page: number = 1,
        perPage: number = 100,
        params: Record<string, any> = {}
    ): Promise<Paginated<T>> {
        const response = await this.httpClient.request<Paginated<T>>({
            method: 'GET',
            endpoint,
            params: {
                ...params,
                page,
                per_page: perPage,
            },
        });

        return response.data;
    }

    async* streamPages<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params: Record<string, any> = {},
        options: PaginationOptions = {}
    ): AsyncGenerator<T[], void, unknown> {
        const {
            maxPages = 1000,
            perPage = 100,
            delay = 50,
        } = options;

        let page = 1;
        let hasMore = true;

        while (hasMore && page <= maxPages) {
            const response = await this.httpClient.request<Paginated<T>>({
                method: 'GET',
                endpoint,
                params: {
                    ...params,
                    page,
                    per_page: perPage,
                },
            });

            if (response.data.data && Array.isArray(response.data.data)) {
                yield response.data.data;
            }

            hasMore = !!response.data.links?.next;
            page++;

            if (hasMore && delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Get all pages with parallel processing for better performance
     */
    async getAllPagesParallel<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params: Record<string, any> = {},
        options: PaginationOptions & { maxConcurrency?: number } = {}
    ): Promise<PaginationResult<T>> {
        const {
            maxPages = 1000,
            perPage = 100,
            maxConcurrency = 3,
            onProgress,
        } = options;

        const startTime = Date.now();

        // First, get the first page to determine total count
        const firstPage = await this.getPage<T>(endpoint, 1, perPage, params);
        const totalCount = Number(firstPage.meta?.total_count) || 0;
        const totalPages = Math.min(Math.ceil(totalCount / perPage), maxPages);

        const allData: T[] = [...(firstPage.data || [])];

        if (totalPages <= 1) {
            return {
                data: allData,
                totalCount,
                pagesFetched: 1,
                duration: Date.now() - startTime,
            };
        }

        // Process remaining pages in parallel batches
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const semaphore = new Semaphore(maxConcurrency);

        const pagePromises = remainingPages.map(async (pageNum) => {
            await semaphore.acquire();
            try {
                const page = await this.getPage<T>(endpoint, pageNum, perPage, params);
                return page.data || [];
            } finally {
                semaphore.release();
            }
        });

        const pageResults = await Promise.all(pagePromises);

        for (const pageData of pageResults) {
            allData.push(...pageData);

            if (onProgress) {
                onProgress(allData.length, totalCount);
            }
        }

        return {
            data: allData,
            totalCount,
            pagesFetched: totalPages,
            duration: Date.now() - startTime,
        };
    }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
    private permits: number;
    private waiting: (() => void)[] = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise(resolve => {
            this.waiting.push(resolve);
        });
    }

    release(): void {
        this.permits++;
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift()!;
            this.permits--;
            resolve();
        }
    }
}
