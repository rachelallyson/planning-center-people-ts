import { del, getList, getSingle, PcoClientState, post } from '../core';
import type { ErrorContext } from '../error-handling';
import {
    ErrorCategory,
    ErrorSeverity,
    withErrorBoundary,
} from '../error-handling';
import { buildQueryParams, extractFileUrl, isFileUpload } from '../helpers';
import {
    FieldDataList,
    FieldDataSingle,
    FieldDatumResource,
    FieldDefinitionResource,
    FieldDefinitionsList,
    FieldDefinitionSingle,
    FieldOptionAttributes,
    FieldOptionResource,
    FieldOptionSingle,
    FieldOptionsList,
    TabResource,
    TabsList,
} from '../types';

/**
 * Create field data for a person (internal)
 */
async function createPersonFieldDataInternal(
    client: PcoClientState,
    personId: string,
    fieldDefinitionId: string,
    value: string,
    context?: Partial<ErrorContext>
): Promise<FieldDataSingle> {
    return post<FieldDatumResource>(
        client,
        `/people/${personId}/field_data`,
        {
            field_definition_id: fieldDefinitionId,
            value,
        },
        undefined,
        {
            ...context,
            endpoint: `/people/${personId}/field_data`,
            method: 'POST',
            personId,
        }
    );
}

/**
 * Delete field data for a person
 */
export async function deletePersonFieldData(
    client: PcoClientState,
    personId: string,
    fieldDataId: string,
    context?: Partial<ErrorContext>
): Promise<void> {
    return del(
        client,
        `/people/${personId}/field_data/${fieldDataId}`,
        undefined,
        {
            ...context,
            endpoint: `/people/${personId}/field_data/${fieldDataId}`,
            method: 'DELETE',
            personId,
        }
    );
}

/**
 * Get field data for a person (custom fields)
 */
export async function getPersonFieldData(
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<FieldDataList> {
    return getList<FieldDatumResource>(
        client,
        `/people/${personId}/field_data`,
        undefined,
        {
            ...context,
            endpoint: `/people/${personId}/field_data`,
            method: 'GET',
            personId,
        }
    );
}

/**
 * Upload a file to PCO and create field data (internal)
 */
async function createPersonFileFieldDataInternal(
    client: PcoClientState,
    personId: string,
    fieldDefinitionId: string,
    fileUrl: string,
    context?: Partial<ErrorContext>
): Promise<FieldDataSingle> {
    return withErrorBoundary(
        async () => {
            // Dynamic import with error handling for optional dependencies
            let axios: any;
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                axios = require('axios');
            } catch (error) {
                throw new Error('axios package is required for file uploads. Please install it: npm install axios');
            }

            // Extract filename from URL
            const urlParts = fileUrl.split('/');
            const filename = urlParts[urlParts.length - 1] ?? 'file';

            // Extract file extension
            const extension = filename.includes('.')
                ? (filename.split('.').pop() ?? '')
                : '';

            // Get MIME type from file extension
            const getMimeType = (ext: string): string => {
                const mimeTypes: Record<string, string> = {
                    csv: 'text/csv',
                    doc: 'application/msword',
                    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    gif: 'image/gif',
                    jpeg: 'image/jpeg',
                    jpg: 'image/jpeg',
                    pdf: 'application/pdf',
                    png: 'image/png',
                    txt: 'text/plain',
                    xls: 'application/vnd.ms-excel',
                    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                };

                return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
            };

            // Download the file from the provided URL
            const fileResponse = await axios.default.get(fileUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 second timeout
            });

            // Step 1: Upload to PCO's upload service first
            let FormDataConstructor: any;
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const FormDataModule = require('form-data');
                // Handle different export patterns
                FormDataConstructor = FormDataModule.default || FormDataModule;
            } catch (error) {
                throw new Error('form-data package is required for file uploads. Please install it: npm install form-data');
            }
            const uploadFormData = new FormDataConstructor();

            uploadFormData.append('file', fileResponse.data, {
                contentType: getMimeType(extension),
                filename,
            });

            // Create a separate axios instance for the upload service with the same auth
            const uploadAxios = axios.default.create({
                headers: {
                    Authorization: client.config.accessToken
                        ? `Bearer ${client.config.accessToken}`
                        : `Basic ${Buffer.from(`${client.config.appId}:${client.config.appSecret}`).toString('base64')}`,
                },
            });

            const uploadResponse = await uploadAxios.post(
                'https://upload.planningcenteronline.com/v2/files',
                uploadFormData,
                {
                    headers: uploadFormData.getHeaders(),
                    timeout: 60000,
                }
            );

            // Step 2: Get the file UUID from the response
            const fileUUID = uploadResponse.data?.data?.[0]?.id;

            if (!fileUUID) {
                throw new Error('Failed to get file UUID from upload response');
            }

            // Step 3: Use the UUID to assign the file to the field
            return createPersonFieldDataInternal(
                client,
                personId,
                fieldDefinitionId,
                fileUUID,
                {
                    ...context,
                    endpoint: `/people/${personId}/field_data`,
                    metadata: {
                        ...context?.metadata,
                        operation: 'create_file_field_data',
                        originalFileUrl: fileUrl,
                        uploadedFileUUID: fileUUID,
                    },
                    method: 'POST',
                }
            );
        },
        {
            ...context,
            category: ErrorCategory.EXTERNAL_API,
            severity: ErrorSeverity.HIGH,
        }
    );
}

/**
 * Get field definitions
 */
export async function getFieldDefinitions(
    client: PcoClientState,
    params?: {
        include?: string[];
        per_page?: number;
        page?: number;
        filter?: string;
        order?: string;
    },
    context?: Partial<ErrorContext>
): Promise<FieldDefinitionsList> {
    return getList<FieldDefinitionResource>(
        client,
        '/field_definitions',
        buildQueryParams(params),
        {
            ...context,
            endpoint: '/field_definitions',
            method: 'GET',
        }
    );
}

/**
 * Get a single field definition by ID
 */
export async function getFieldDefinition(
    client: PcoClientState,
    fieldId: string,
    params?: { include?: string[] },
    context?: Partial<ErrorContext>
): Promise<FieldDefinitionSingle> {
    return getSingle<FieldDefinitionResource>(
        client,
        `/field_definitions/${fieldId}`,
        buildQueryParams(params),
        {
            ...context,
            endpoint: `/field_definitions/${fieldId}`,
            method: 'GET',
        }
    );
}

/**
 * Get field options for a field definition
 */
export async function getFieldOptions(
    client: PcoClientState,
    fieldDefinitionId: string,
    context?: Partial<ErrorContext>
): Promise<FieldOptionsList> {
    return getList<FieldOptionResource>(
        client,
        `/field_definitions/${fieldDefinitionId}/field_options`,
        undefined,
        {
            ...context,
            endpoint: `/field_definitions/${fieldDefinitionId}/field_options`,
            fieldDefinitionId,
            method: 'GET',
        }
    );
}

/**
 * Create a field option for a field definition
 */
export async function createFieldOption(
    client: PcoClientState,
    fieldDefinitionId: string,
    data: Partial<FieldOptionAttributes>,
    context?: Partial<ErrorContext>
): Promise<FieldOptionSingle> {
    return post<FieldOptionResource>(
        client,
        `/field_definitions/${fieldDefinitionId}/field_options`,
        data,
        undefined,
        {
            ...context,
            endpoint: `/field_definitions/${fieldDefinitionId}/field_options`,
            fieldDefinitionId,
            method: 'POST',
        }
    );
}

/**
 * Get tabs
 */
export async function getTabs(
    client: PcoClientState,
    params?: {
        include?: string[];
        per_page?: number;
        page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<TabsList> {
    return getList<TabResource>(
        client,
        '/tabs',
        buildQueryParams(params),
        {
            ...context,
            endpoint: '/tabs',
            method: 'GET',
        }
    );
}

/**
 * Create a field definition
 */
export async function createFieldDefinition(
    client: PcoClientState,
    tabId: string,
    data: {
        name: string;
        data_type: string;
        sequence?: number;
        slug?: string;
        config?: string | Record<string, any>;
    },
    context?: Partial<ErrorContext>
): Promise<FieldDefinitionSingle> {
    return post<FieldDefinitionResource>(
        client,
        `/tabs/${tabId}/field_definitions`,
        data,
        undefined,
        {
            ...context,
            endpoint: `/tabs/${tabId}/field_definitions`,
            method: 'POST',
        }
    );
}

/**
 * Delete a field definition
 */
export async function deleteFieldDefinition(
    client: PcoClientState,
    fieldDefinitionId: string,
    context?: Partial<ErrorContext>
): Promise<void> {
    return del(
        client,
        `/field_definitions/${fieldDefinitionId}`,
        undefined,
        {
            ...context,
            endpoint: `/field_definitions/${fieldDefinitionId}`,
            method: 'DELETE',
            fieldDefinitionId,
        }
    );
}

/**
 * Helper function to check if a field definition has a data_type attribute
 */
function hasDataType(fieldDef: any): fieldDef is { data_type: string } {
    return fieldDef && typeof fieldDef.data_type === 'string';
}

/**
 * Create field data for a person with automatic file upload handling
 * Determines field type and uses appropriate creation method
 */
export async function createPersonFieldData(
    client: PcoClientState,
    personId: string,
    fieldId: string,
    value: string,
    context?: Partial<ErrorContext>
): Promise<FieldDataSingle> {
    // Get field definition to determine type
    // Get field definition by ID - try direct fetch first, then search in ordered list
    let fieldDef: FieldDefinitionResource | undefined;

    // First try direct fetch
    const singleFieldDef = await getFieldDefinition(client, fieldId, { include: [] }, {
        ...context,
        metadata: {
            ...context?.metadata,
            operation: 'get_field_definition_direct',
        },
    });
    fieldDef = singleFieldDef.data || undefined;

    // If direct fetch fails, search through the list ordered by creation date (newest first)
    if (!fieldDef) {
        const fieldDefinition = await getFieldDefinitions(
            client,
            {
                include: [],
                // Include deleted fields in case the field was soft-deleted
                filter: 'include_deleted',
                per_page: 200, // Get more fields to ensure we find the one we need
                order: '-created_at', // Order by creation date, newest first
            },
            {
                ...context,
                metadata: {
                    ...context?.metadata,
                    operation: 'get_field_definition_list',
                },
            }
        );

        // Find the specific field definition
        fieldDef = fieldDefinition.data?.find(f => f.id === fieldId);

        if (!fieldDef) {
            // Debug: log available field IDs to help troubleshoot
            const availableIds = fieldDefinition.data?.map(f => f.id) || [];
            console.log(`Field definition not found for field ID: ${fieldId}`);
            console.log(`Available field definition IDs: ${availableIds.slice(0, 10).join(', ')}${availableIds.length > 10 ? '...' : ''}`);
            console.log(`Total field definitions found: ${fieldDefinition.data?.length || 0}`);

            throw new Error(`Field definition not found for field ID: ${fieldId}`);
        }
    }

    // Check if this is a file field
    if (hasDataType(fieldDef.attributes) && fieldDef.attributes.data_type === 'file') {
        // This is a file field - always use file upload
        const fileUrl = isFileUpload(value) ? extractFileUrl(value) : value;

        return createPersonFileFieldDataInternal(
            client,
            personId,
            fieldId,
            fileUrl,
            {
                ...context,
                endpoint: `/people/${personId}/field_data`,
                metadata: {
                    ...context?.metadata,
                    operation: 'create_file_field_data',
                },
                method: 'POST',
            }
        );
    }

    // This is a text field - clean the value if it's a file URL
    const cleanValue = isFileUpload(value) ? extractFileUrl(value) : value;

    return createPersonFieldDataInternal(client, personId, fieldId, cleanValue, {
        ...context,
        endpoint: `/people/${personId}/field_data`,
        metadata: {
            ...context?.metadata,
            operation: 'create_text_field_data',
        },
        method: 'POST',
    });
}
