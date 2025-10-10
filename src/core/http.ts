/**
 * v2.0.0 HTTP Client
 */

import type { PcoClientConfig } from '../types/client';
import type { PcoEvent } from '../types/events';
import { PcoEventEmitter, RequestIdGenerator, PerformanceMetrics, RateLimitTracker } from '../monitoring';
import { PcoRateLimiter } from '../rate-limiter';
import { PcoApiError } from '../api-error';
import { attemptTokenRefresh, hasRefreshTokenCapability } from '../auth';

export interface HttpRequestOptions {
    method: string;
    endpoint: string;
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface HttpResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
    requestId: string;
    duration: number;
}

export class PcoHttpClient {
    private config: PcoClientConfig;
    private eventEmitter: PcoEventEmitter;
    private requestIdGenerator: RequestIdGenerator;
    private performanceMetrics: PerformanceMetrics;
    private rateLimitTracker: RateLimitTracker;
    private rateLimiter: PcoRateLimiter;

    constructor(config: PcoClientConfig, eventEmitter: PcoEventEmitter) {
        this.config = config;
        this.eventEmitter = eventEmitter;
        this.requestIdGenerator = new RequestIdGenerator();
        this.performanceMetrics = new PerformanceMetrics();
        this.rateLimitTracker = new RateLimitTracker();

        // Initialize rate limiter
        this.rateLimiter = new PcoRateLimiter(100, 60000); // 100 requests per minute
    }

    async request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const requestId = this.requestIdGenerator.generate();
        const startTime = Date.now();

        // Emit request start event
        this.eventEmitter.emit({
            type: 'request:start',
            endpoint: options.endpoint,
            method: options.method,
            requestId,
            timestamp: new Date().toISOString(),
        });

        try {
            // Wait for rate limiter
            await this.rateLimiter.waitForAvailability();

            const response = await this.makeRequest<T>(options, requestId);
            const duration = Date.now() - startTime;

            // Record performance metrics
            this.performanceMetrics.record(`${options.method} ${options.endpoint}`, duration, true);

            // Update rate limit tracking
            this.updateRateLimitTracking(options.endpoint, response.headers);

            // Emit request complete event
            this.eventEmitter.emit({
                type: 'request:complete',
                endpoint: options.endpoint,
                method: options.method,
                status: response.status,
                duration,
                requestId,
                timestamp: new Date().toISOString(),
            });

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;

            // Record performance metrics
            this.performanceMetrics.record(`${options.method} ${options.endpoint}`, duration, false);

            // Emit request error event
            this.eventEmitter.emit({
                type: 'request:error',
                endpoint: options.endpoint,
                method: options.method,
                error: error as Error,
                requestId,
                timestamp: new Date().toISOString(),
            });

            throw error;
        }
    }

    private async makeRequest<T>(options: HttpRequestOptions, requestId: string): Promise<HttpResponse<T>> {
        const baseURL = this.config.baseURL || 'https://api.planningcenteronline.com/people/v2';
        let url = options.endpoint.startsWith('http') ? options.endpoint : `${baseURL}${options.endpoint}`;

        // Add query parameters
        if (options.params) {
            const searchParams = new URLSearchParams();
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
            }
        }

        // Prepare headers
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...this.config.headers,
            ...options.headers,
        };

        // Add authentication
        this.addAuthentication(headers);

        // Prepare request options
        const requestOptions: RequestInit = {
            headers,
            method: options.method,
        };

        // Add body for POST/PATCH requests
        if ((options.method === 'POST' || options.method === 'PATCH') && options.data) {
            // Determine resource type from endpoint
            const resourceType = this.getResourceTypeFromEndpoint(options.endpoint);

            // Separate attributes and relationships
            const { relationships, ...attributes } = options.data;

            const jsonApiData: any = {
                data: {
                    type: resourceType,
                    attributes
                }
            };

            // Add relationships if present
            if (relationships) {
                jsonApiData.data.relationships = relationships;
            }

            requestOptions.body = JSON.stringify(jsonApiData);
        }

        // Add timeout
        const timeout = options.timeout || this.config.timeout || 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        requestOptions.signal = controller.signal;

        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);

            // Update rate limiter from headers
            const rateLimitHeaders = {
                'Retry-After': response.headers.get('retry-after') || undefined,
                'X-PCO-API-Request-Rate-Count': response.headers.get('x-pco-api-request-rate-count') || undefined,
                'X-PCO-API-Request-Rate-Limit': response.headers.get('x-pco-api-request-rate-limit') || undefined,
                'X-PCO-API-Request-Rate-Period': response.headers.get('x-pco-api-request-rate-period') || undefined,
            };

            this.rateLimiter.updateFromHeaders(rateLimitHeaders);
            this.rateLimiter.recordRequest();

            // Handle 429 responses
            if (response.status === 429) {
                await this.rateLimiter.waitForAvailability();
                return this.makeRequest<T>(options, requestId);
            }

            // Handle other errors
            if (!response.ok) {
                // Handle 401 errors with token refresh if available
                if (response.status === 401 && this.config.auth.type === 'oauth') {
                    try {
                        await this.attemptTokenRefresh();
                        return this.makeRequest<T>(options, requestId);
                    } catch (refreshError) {
                        console.warn('Token refresh failed:', refreshError);
                        // Call the onRefreshFailure callback
                        await this.config.auth.onRefreshFailure(refreshError as Error);
                    }
                }

                let errorData: any;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = {};
                }

                throw PcoApiError.fromFetchError(response, errorData);
            }

            // Parse response
            if (options.method === 'DELETE') {
                return {
                    data: undefined as any,
                    status: response.status,
                    headers: this.extractHeaders(response),
                    requestId,
                    duration: 0, // Will be set by caller
                };
            }

            const data = await response.json();
            return {
                data,
                status: response.status,
                headers: this.extractHeaders(response),
                requestId,
                duration: 0, // Will be set by caller
            };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    private addAuthentication(headers: Record<string, string>): void {
        if (this.config.auth.type === 'personal_access_token') {
            // Personal Access Tokens use HTTP Basic Auth format: app_id:secret
            // The personalAccessToken should be in the format "app_id:secret"
            headers.Authorization = `Basic ${Buffer.from(this.config.auth.personalAccessToken).toString('base64')}`;
        } else if (this.config.auth.type === 'oauth') {
            headers.Authorization = `Bearer ${this.config.auth.accessToken}`;
        }
    }

    private getResourceTypeFromEndpoint(endpoint: string): string {
        // Extract resource type from endpoint
        // /households -> Household
        // /people -> Person
        // /emails -> Email
        // etc.
        const pathParts = endpoint.split('/').filter(part => part.length > 0);
        const resourcePath = pathParts[pathParts.length - 1];

        // Convert kebab-case to PascalCase and make singular
        const pascalCase = resourcePath
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        // Make singular (remove trailing 's' if it exists and the word is longer than 3 characters)
        if (pascalCase.endsWith('s') && pascalCase.length > 3) {
            return pascalCase.slice(0, -1);
        }

        return pascalCase;
    }

    private extractHeaders(response: Response): Record<string, string> {
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return headers;
    }

    private async attemptTokenRefresh(): Promise<void> {
        if (this.config.auth.type !== 'oauth') {
            throw new Error('Token refresh is only available for OAuth authentication');
        }

        const baseURL = this.config.baseURL || 'https://api.planningcenteronline.com/people/v2';
        const tokenUrl = baseURL.replace('/people/v2', '/oauth/token');

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.config.auth.refreshToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
        }

        const tokens = await response.json();

        // Update the config with new tokens
        this.config.auth.accessToken = tokens.access_token;
        this.config.auth.refreshToken = tokens.refresh_token;

        // Call the onRefresh callback
        await this.config.auth.onRefresh({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });
    }

    private updateRateLimitTracking(endpoint: string, headers: Record<string, string>): void {
        const limit = headers['x-pco-api-request-rate-limit'];
        const remaining = headers['x-pco-api-request-rate-count'];
        const resetTime = headers['retry-after'];

        if (limit && remaining && resetTime) {
            this.rateLimitTracker.update(
                endpoint,
                parseInt(limit),
                parseInt(remaining),
                Date.now() + parseInt(resetTime) * 1000
            );
        }
    }

    getPerformanceMetrics() {
        return this.performanceMetrics.getMetrics();
    }

    getRateLimitInfo() {
        return this.rateLimitTracker.getAllLimits();
    }

    /**
     * Get authentication header for external services (like file uploads)
     */
    getAuthHeader(): string {
        if (this.config.auth.type === 'personal_access_token') {
            return `Basic ${Buffer.from(this.config.auth.personalAccessToken).toString('base64')}`;
        } else if (this.config.auth.type === 'oauth') {
            return `Bearer ${this.config.auth.accessToken}`;
        }
        return '';
    }
}
