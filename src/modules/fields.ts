/**
 * v2.0.0 Fields Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    FieldDefinitionResource,
    FieldDefinitionAttributes,
    FieldDatumResource,
    FieldDatumAttributes,
    FieldOptionResource,
    FieldOptionAttributes,
    TabResource,
    TabAttributes
} from '../types';

export interface FieldDefinitionCache {
    byId: Map<string, FieldDefinitionResource>;
    bySlug: Map<string, FieldDefinitionResource>;
    byName: Map<string, FieldDefinitionResource>;
    lastUpdated: number;
}

export interface FieldSetOptions {
    /** Field definition ID */
    fieldId?: string;
    /** Field definition slug */
    fieldSlug?: string;
    /** Field definition name */
    fieldName?: string;
    /** Value to set */
    value: string;
    /** Whether to handle file uploads automatically */
    handleFileUploads?: boolean;
}

export class FieldsModule extends BaseModule {
    private fieldDefinitionCache: FieldDefinitionCache | null = null;
    private cacheTtl: number = 300000; // 5 minutes

    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all field definitions with caching
     */
    async getAllFieldDefinitions(useCache: boolean = true): Promise<FieldDefinitionResource[]> {
        if (useCache && this.isCacheValid()) {
            return Array.from(this.fieldDefinitionCache!.byId.values());
        }

        const result = await this.getAllPages<FieldDefinitionResource>('/field_definitions', {
            include: ['tab'],
        });

        // Update cache
        this.updateFieldDefinitionCache(result.data);

        return result.data;
    }

    /**
     * Get a single field definition by ID
     */
    async getFieldDefinition(id: string): Promise<FieldDefinitionResource> {
        return this.getSingle<FieldDefinitionResource>(`/field_definitions/${id}`);
    }

    /**
     * Get field definition by slug
     */
    async getFieldDefinitionBySlug(slug: string): Promise<FieldDefinitionResource | null> {
        await this.ensureCacheLoaded();

        return this.fieldDefinitionCache?.bySlug.get(slug) || null;
    }

    /**
     * Get field definition by name
     */
    async getFieldDefinitionByName(name: string): Promise<FieldDefinitionResource | null> {
        await this.ensureCacheLoaded();

        return this.fieldDefinitionCache?.byName.get(name) || null;
    }

    /**
     * Create a field definition
     */
    async createFieldDefinition(tabId: string, data: FieldDefinitionAttributes): Promise<FieldDefinitionResource> {
        const fieldDef = await this.createResource<FieldDefinitionResource>(`/tabs/${tabId}/field_definitions`, data);

        // Invalidate cache
        this.invalidateCache();

        return fieldDef;
    }

    /**
     * Update a field definition
     */
    async updateFieldDefinition(id: string, data: Partial<FieldDefinitionAttributes>): Promise<FieldDefinitionResource> {
        const fieldDef = await this.updateResource<FieldDefinitionResource>(`/field_definitions/${id}`, data);

        // Update cache
        if (this.fieldDefinitionCache && fieldDef.attributes) {
            this.fieldDefinitionCache.byId.set(id, fieldDef);
            this.fieldDefinitionCache.bySlug.set(fieldDef.attributes.slug, fieldDef);
            this.fieldDefinitionCache.byName.set(fieldDef.attributes.name, fieldDef);
        }

        return fieldDef;
    }

    /**
     * Delete a field definition
     */
    async deleteFieldDefinition(id: string): Promise<void> {
        await this.deleteResource(`/field_definitions/${id}`);

        // Remove from cache
        if (this.fieldDefinitionCache) {
            const fieldDef = this.fieldDefinitionCache.byId.get(id);
            if (fieldDef && fieldDef.attributes) {
                this.fieldDefinitionCache.byId.delete(id);
                this.fieldDefinitionCache.bySlug.delete(fieldDef.attributes.slug);
                this.fieldDefinitionCache.byName.delete(fieldDef.attributes.name);
            }
        }
    }

    /**
     * Get field options for a field definition
     */
    async getFieldOptions(fieldDefinitionId: string): Promise<{ data: FieldOptionResource[]; meta?: any; links?: any }> {
        return this.getList<FieldOptionResource>(`/field_definitions/${fieldDefinitionId}/field_options`);
    }

    /**
     * Create a field option
     */
    async createFieldOption(fieldDefinitionId: string, data: FieldOptionAttributes): Promise<FieldOptionResource> {
        return this.createResource<FieldOptionResource>(`/field_definitions/${fieldDefinitionId}/field_options`, data);
    }

    /**
     * Get person's field data
     */
    async getPersonFieldData(personId: string): Promise<{ data: FieldDatumResource[]; meta?: any; links?: any }> {
        return this.getList<FieldDatumResource>(`/people/${personId}/field_data`);
    }

    /**
     * Set a person's field value with automatic field lookup
     */
    async setPersonField(personId: string, options: FieldSetOptions): Promise<FieldDatumResource> {
        const fieldDef = await this.resolveFieldDefinition(options);

        if (!fieldDef) {
            throw new Error(`Field definition not found for: ${options.fieldId || options.fieldSlug || options.fieldName}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, options.value, {
            handleFileUploads: options.handleFileUploads ?? true,
        });
    }

    /**
     * Set a person's field value by field definition ID
     */
    async setPersonFieldById(personId: string, fieldId: string, value: string): Promise<FieldDatumResource> {
        return this.createPersonFieldData(personId, fieldId, value);
    }

    /**
     * Set a person's field value by field slug
     */
    async setPersonFieldBySlug(personId: string, fieldSlug: string, value: string): Promise<FieldDatumResource> {
        const fieldDef = await this.getFieldDefinitionBySlug(fieldSlug);

        if (!fieldDef) {
            throw new Error(`Field definition not found for slug: ${fieldSlug}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, value);
    }

    /**
     * Set a person's field value by field name
     */
    async setPersonFieldByName(personId: string, fieldName: string, value: string): Promise<FieldDatumResource> {
        const fieldDef = await this.getFieldDefinitionByName(fieldName);

        if (!fieldDef) {
            throw new Error(`Field definition not found for name: ${fieldName}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, value);
    }

    /**
     * Create field data for a person
     */
    async createPersonFieldData(
        personId: string,
        fieldDefinitionId: string,
        value: string,
        options: { handleFileUploads?: boolean } = {}
    ): Promise<FieldDatumResource> {
        const { handleFileUploads = true } = options;

        // Get field definition to determine type
        const fieldDef = await this.getFieldDefinition(fieldDefinitionId);

        // Check if this is a file field and handle accordingly
        if (fieldDef.attributes && fieldDef.attributes.data_type === 'file' && handleFileUploads) {
            return this.createPersonFileFieldData(personId, fieldDefinitionId, value);
        }

        // For text fields, clean the value if it's a file URL
        const cleanValue = this.isFileUrl(value) ? this.extractFileUrl(value) : value;

        // Check if field data already exists for this person and field
        try {
            const existingFieldData = await this.getPersonFieldData(personId);
            const existingDatum = existingFieldData.data.find(
                datum => {
                    const fieldDefData = datum.relationships?.field_definition?.data;
                    return Array.isArray(fieldDefData)
                        ? fieldDefData.some(fd => fd.id === fieldDefinitionId)
                        : fieldDefData?.id === fieldDefinitionId;
                }
            );

            if (existingDatum) {
                // Update existing field data
                return this.updateResource<FieldDatumResource>(
                    `/people/${personId}/field_data/${existingDatum.id}`,
                    { value: cleanValue }
                );
            }
        } catch (error) {
            // If we can't get existing field data, continue with creation
        }

        return this.createResource<FieldDatumResource>(`/people/${personId}/field_data`, {
            field_definition_id: fieldDefinitionId,
            value: cleanValue,
        });
    }

    /**
     * Delete person's field data
     */
    async deletePersonFieldData(personId: string, fieldDataId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/field_data/${fieldDataId}`);
    }

    /**
     * Get all tabs
     */
    async getTabs(): Promise<{ data: TabResource[]; meta?: any; links?: any }> {
        return this.getList<TabResource>('/tabs');
    }

    /**
     * Create a tab
     */
    async createTab(data: TabAttributes): Promise<TabResource> {
        return this.createResource<TabResource>('/tabs', data);
    }

    /**
     * Update a tab
     */
    async updateTab(id: string, data: Partial<TabAttributes>): Promise<TabResource> {
        return this.updateResource<TabResource>(`/tabs/${id}`, data);
    }

    /**
     * Delete a tab
     */
    async deleteTab(id: string): Promise<void> {
        return this.deleteResource(`/tabs/${id}`);
    }

    /**
     * Resolve field definition from options
     */
    private async resolveFieldDefinition(options: FieldSetOptions): Promise<FieldDefinitionResource | null> {
        if (options.fieldId) {
            return this.getFieldDefinition(options.fieldId);
        }

        if (options.fieldSlug) {
            return this.getFieldDefinitionBySlug(options.fieldSlug);
        }

        if (options.fieldName) {
            return this.getFieldDefinitionByName(options.fieldName);
        }

        return null;
    }

    /**
     * Create field data for file uploads
     */
    private async createPersonFileFieldData(
        personId: string,
        fieldDefinitionId: string,
        fileUrl: string
    ): Promise<FieldDatumResource> {
        // This would implement the file upload logic from the original implementation
        // For now, return a placeholder
        throw new Error('File upload functionality not yet implemented in v2.0');
    }

    /**
     * Check if cache is valid
     */
    private isCacheValid(): boolean {
        if (!this.fieldDefinitionCache) {
            return false;
        }

        return Date.now() - this.fieldDefinitionCache.lastUpdated < this.cacheTtl;
    }

    /**
     * Ensure cache is loaded
     */
    private async ensureCacheLoaded(): Promise<void> {
        if (!this.isCacheValid()) {
            await this.getAllFieldDefinitions(false);
        }
    }

    /**
     * Update field definition cache
     */
    private updateFieldDefinitionCache(fieldDefinitions: FieldDefinitionResource[]): void {
        this.fieldDefinitionCache = {
            byId: new Map(),
            bySlug: new Map(),
            byName: new Map(),
            lastUpdated: Date.now(),
        };

        for (const fieldDef of fieldDefinitions) {
            if (fieldDef.attributes) {
                this.fieldDefinitionCache.byId.set(fieldDef.id, fieldDef);
                this.fieldDefinitionCache.bySlug.set(fieldDef.attributes.slug, fieldDef);
                this.fieldDefinitionCache.byName.set(fieldDef.attributes.name, fieldDef);
            }
        }
    }

    /**
     * Invalidate cache
     */
    private invalidateCache(): void {
        this.fieldDefinitionCache = null;
    }

    /**
     * Check if a value is a file URL
     */
    private isFileUrl(value: string): boolean {
        return value.includes('s3.') || value.includes('amazonaws.com') || value.includes('<a href=');
    }

    /**
     * Extract file URL from HTML markup
     */
    private extractFileUrl(value: string): string {
        if (value.startsWith('http') && !value.includes('<')) {
            return value;
        }

        const hrefMatch = /href=["']([^"']+)["']/.exec(value);
        if (hrefMatch) {
            return hrefMatch[1];
        }

        const urlMatch = /(https?:\/\/[^\s<>"']+)/.exec(value);
        if (urlMatch) {
            return urlMatch[1];
        }

        return value;
    }
}
