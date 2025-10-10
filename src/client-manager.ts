/**
 * v2.0.0 Client Manager with Caching
 */

import type { PcoClientConfig } from './types/client';
import { PcoClient } from './client';

export interface ClientConfigResolver {
    (churchId: string): Promise<PcoClientConfig> | PcoClientConfig;
}

export class PcoClientManager {
    private static instance: PcoClientManager;
    private clientCache = new Map<string, PcoClient>();
    private configCache = new Map<string, PcoClientConfig>();

    private constructor() { }

    /**
     * Get the singleton instance
     */
    static getInstance(): PcoClientManager {
        if (!PcoClientManager.instance) {
            PcoClientManager.instance = new PcoClientManager();
        }
        return PcoClientManager.instance;
    }

    /**
     * Get a client instance with the given configuration
     */
    static getClient(config: PcoClientConfig): PcoClient {
        return PcoClientManager.getInstance().getClient(config);
    }

    /**
     * Get a client instance for a specific church with config resolution
     */
    static async getClientForChurch(
        churchId: string,
        configResolver: ClientConfigResolver
    ): Promise<PcoClient> {
        return PcoClientManager.getInstance().getClientForChurch(churchId, configResolver);
    }

    /**
     * Clear the client cache
     */
    static clearCache(): void {
        PcoClientManager.getInstance().clearCache();
    }

    /**
     * Get a client instance with caching
     */
    getClient(config: PcoClientConfig): PcoClient {
        const configKey = this.generateConfigKey(config);

        // Check if we have a cached client
        let client = this.clientCache.get(configKey);

        if (!client) {
            // Create new client
            client = new PcoClient(config);
            this.clientCache.set(configKey, client);
            this.configCache.set(configKey, { ...config });
        } else {
            // Check if config has changed
            const cachedConfig = this.configCache.get(configKey);
            if (cachedConfig && this.hasConfigChanged(cachedConfig, config)) {
                // Update client with new config
                client.updateConfig(config);
                this.configCache.set(configKey, { ...config });
            }
        }

        return client;
    }

    /**
     * Get a client instance for a specific church
     */
    async getClientForChurch(
        churchId: string,
        configResolver: ClientConfigResolver
    ): Promise<PcoClient> {
        const configKey = `church:${churchId}`;

        // Check if we have a cached client
        let client = this.clientCache.get(configKey);

        if (!client) {
            // Resolve configuration
            const config = await configResolver(churchId);

            // Create new client
            client = new PcoClient(config);
            this.clientCache.set(configKey, client);
            this.configCache.set(configKey, { ...config });
        }

        return client;
    }

    /**
     * Clear the client cache
     */
    clearCache(): void {
        this.clientCache.clear();
        this.configCache.clear();
    }

    /**
     * Remove a specific client from cache
     */
    removeClient(config: PcoClientConfig): void {
        const configKey = this.generateConfigKey(config);
        this.clientCache.delete(configKey);
        this.configCache.delete(configKey);
    }

    /**
     * Remove a church client from cache
     */
    removeChurchClient(churchId: string): void {
        const configKey = `church:${churchId}`;
        this.clientCache.delete(configKey);
        this.configCache.delete(configKey);
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        clientCount: number;
        configCount: number;
        churchClients: number;
    } {
        const churchClients = Array.from(this.clientCache.keys()).filter(key =>
            key.startsWith('church:')
        ).length;

        return {
            clientCount: this.clientCache.size,
            configCount: this.configCache.size,
            churchClients,
        };
    }

    /**
     * Generate a cache key for a configuration
     */
    private generateConfigKey(config: PcoClientConfig): string {
        // Create a hash of the configuration
        const configStr = JSON.stringify({
            authType: config.auth.type,
            hasAccessToken: !!config.auth.accessToken,
            hasRefreshToken: !!config.auth.refreshToken,
            hasPersonalAccessToken: !!config.auth.personalAccessToken,
            baseURL: config.baseURL,
            timeout: config.timeout,
        });

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < configStr.length; i++) {
            const char = configStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return `config:${Math.abs(hash)}`;
    }

    /**
     * Check if configuration has changed
     */
    private hasConfigChanged(oldConfig: PcoClientConfig, newConfig: PcoClientConfig): boolean {
        // Compare key configuration properties
        return (
            oldConfig.auth.type !== newConfig.auth.type ||
            oldConfig.auth.accessToken !== newConfig.auth.accessToken ||
            oldConfig.auth.refreshToken !== newConfig.auth.refreshToken ||
            oldConfig.auth.personalAccessToken !== newConfig.auth.personalAccessToken ||
            oldConfig.baseURL !== newConfig.baseURL ||
            oldConfig.timeout !== newConfig.timeout
        );
    }
}
