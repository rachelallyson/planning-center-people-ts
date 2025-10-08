import { del, getList, getSingle, patch, PcoClientState, post } from './core';
import type { ErrorContext } from './error-handling';
import {
  ErrorCategory,
  ErrorSeverity,
  withErrorBoundary,
} from './error-handling';
import {
  AddressAttributes,
  AddressesList,
  AddressResource,
  AddressSingle,
  EmailAttributes,
  EmailResource,
  EmailSingle,
  EmailsList,
  // Field data
  FieldDataList,
  FieldDataSingle,
  FieldDatumResource,
  FieldDefinitionResource,
  FieldDefinitionsList,
  FieldOptionAttributes,
  FieldOptionResource,
  FieldOptionSingle,
  FieldOptionsList,
  HouseholdResource,
  HouseholdSingle,
  HouseholdsList,
  ListCategoriesList,
  ListCategoryResource,
  ListResource,
  ListSingle,
  ListsList,
  NoteCategoriesList,
  NoteCategoryResource,
  NoteResource,
  NoteSingle,
  NotesList,
  OrganizationResource,
  OrganizationSingle,
  // Included union
  PeopleIncluded,
  // Document types
  PeopleList,
  PersonAttributes,
  // PCO People types
  PersonResource,
  PersonSingle,
  PhoneNumberAttributes,
  PhoneNumberResource,
  PhoneNumberSingle,
  PhoneNumbersList,
  SocialProfileAttributes,
  SocialProfileResource,
  SocialProfileSingle,
  SocialProfilesList,
  WorkflowCardAttributes,
  // Workflow notes
  WorkflowCardNoteAttributes,
  WorkflowCardNoteResource,
  WorkflowCardNoteSingle,
  WorkflowCardNotesList,
  // Workflow cards
  WorkflowCardResource,
  WorkflowCardSingle,
  WorkflowCardsList,
  WorkflowResource,
  WorkflowSingle,
  WorkflowsList,
} from './types';

// ===== Helper Functions =====

/**
 * Transform complex params object into flat query params for API calls
 */
function buildQueryParams(params?: {
  where?: Record<string, any>;
  include?: string[];
  per_page?: number;
  page?: number;
}): Record<string, any> {
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

  if (params?.page) {
    queryParams.page = params.page;
  }

  return queryParams;
}

// ===== People API Functions =====

/**
 * Get all people with optional filtering and pagination
 */
export async function getPeople(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<PeopleList> {
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

  if (params?.page) {
    queryParams.page = params.page;
  }

  const result = await getList<PersonResource, PeopleIncluded>(
    client,
    '/people',
    queryParams,
    {
      ...context,
      endpoint: '/people',
      method: 'GET',
    }
  );

  return result as PeopleList;
}

/**
 * Get a single person by ID
 */
export async function getPerson(
  client: PcoClientState,
  id: string,
  include?: string[],
  context?: Partial<ErrorContext>
): Promise<PersonSingle> {
  const params: Record<string, any> = {};

  if (include) {
    params.include = include.join(',');
  }

  return (await getSingle<PersonResource, PeopleIncluded>(
    client,
    `/people/${id}`,
    params,
    {
      ...context,
      endpoint: `/people/${id}`,
      method: 'GET',
      personId: id,
    }
  )) as PersonSingle;
}

/**
 * Create a new person
 */
export async function createPerson(
  client: PcoClientState,
  data: Partial<PersonAttributes>,
  context?: Partial<ErrorContext>
): Promise<PersonSingle> {
  return post<PersonResource>(client, '/people', data, undefined, {
    ...context,
    endpoint: '/people',
    method: 'POST',
  });
}

/**
 * Update a person
 */
export async function updatePerson(
  client: PcoClientState,
  id: string,
  data: Partial<PersonAttributes>,
  context?: Partial<ErrorContext>
): Promise<PersonSingle> {
  return patch<PersonResource>(client, `/people/${id}`, data, undefined, {
    ...context,
    endpoint: `/people/${id}`,
    method: 'PATCH',
    personId: id,
  });
}

/**
 * Delete a person
 */
export async function deletePerson(
  client: PcoClientState,
  id: string,
  context?: Partial<ErrorContext>
): Promise<void> {
  return del(client, `/people/${id}`, undefined, {
    ...context,
    endpoint: `/people/${id}`,
    method: 'DELETE',
    personId: id,
  });
}

/**
 * Get all emails for a person
 */
export async function getPersonEmails(
  client: PcoClientState,
  personId: string,
  context?: Partial<ErrorContext>
): Promise<EmailsList> {
  return getList<EmailResource>(
    client,
    `/people/${personId}/emails`,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/emails`,
      method: 'GET',
      personId,
    }
  );
}

/**
 * Create an email for a person
 */
export async function createPersonEmail(
  client: PcoClientState,
  personId: string,
  data: Partial<EmailAttributes>,
  context?: Partial<ErrorContext>
): Promise<EmailSingle> {
  return post<EmailResource>(
    client,
    `/people/${personId}/emails`,
    data,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/emails`,
      method: 'POST',
      personId,
    }
  );
}

/**
 * Get all phone numbers for a person
 */
export async function getPersonPhoneNumbers(
  client: PcoClientState,
  personId: string,
  context?: Partial<ErrorContext>
): Promise<PhoneNumbersList> {
  return getList<PhoneNumberResource>(
    client,
    `/people/${personId}/phone_numbers`,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/phone_numbers`,
      method: 'GET',
      personId,
    }
  );
}

/**
 * Create a phone number for a person
 */
export async function createPersonPhoneNumber(
  client: PcoClientState,
  personId: string,
  data: Partial<PhoneNumberAttributes>,
  context?: Partial<ErrorContext>
): Promise<PhoneNumberSingle> {
  return post<PhoneNumberResource>(
    client,
    `/people/${personId}/phone_numbers`,
    data,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/phone_numbers`,
      method: 'POST',
      personId,
    }
  );
}

/**
 * Get all addresses for a person
 */
export async function getPersonAddresses(
  client: PcoClientState,
  personId: string,
  context?: Partial<ErrorContext>
): Promise<AddressesList> {
  return getList<AddressResource>(
    client,
    `/people/${personId}/addresses`,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/addresses`,
      method: 'GET',
      personId,
    }
  );
}

/**
 * Create field data for a person
 */
export async function createPersonFieldData(
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
 * Create an address for a person
 */
export async function createPersonAddress(
  client: PcoClientState,
  personId: string,
  data: Partial<AddressAttributes>,
  context?: Partial<ErrorContext>
): Promise<AddressSingle> {
  return post<AddressResource>(
    client,
    `/people/${personId}/addresses`,
    data,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/addresses`,
      method: 'POST',
      personId,
    }
  );
}

/**
 * Update an address for a person
 */
export async function updatePersonAddress(
  client: PcoClientState,
  personId: string,
  addressId: string,
  data: Partial<AddressAttributes>,
  context?: Partial<ErrorContext>
): Promise<AddressSingle> {
  return patch<AddressResource>(
    client,
    `/people/${personId}/addresses/${addressId}`,
    data,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/addresses/${addressId}`,
      method: 'PATCH',
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
 * Upload a file to PCO and create field data
 */
export async function createPersonFileFieldData(
  client: PcoClientState,
  personId: string,
  fieldDefinitionId: string,
  fileUrl: string,
  context?: Partial<ErrorContext>
): Promise<FieldDataSingle> {
  return withErrorBoundary(
    async () => {
      const axios = await import('axios');

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
      const FormDataModule = await import('form-data');
      const FormDataConstructor = FormDataModule.default;
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
      return createPersonFieldData(
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
 * Get all households
 */
export async function getHouseholds(
  client: PcoClientState,
  params?: {
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<HouseholdsList> {
  const queryParams: Record<string, any> = {};

  if (params?.include) {
    queryParams.include = params.include.join(',');
  }

  if (params?.per_page) {
    queryParams.per_page = params.per_page;
  }

  if (params?.page) {
    queryParams.page = params.page;
  }

  return getList<HouseholdResource>(client, '/households', queryParams, {
    ...context,
    endpoint: '/households',
    method: 'GET',
  });
}

/**
 * Get a single household by ID
 */
export async function getHousehold(
  client: PcoClientState,
  id: string,
  include?: string[],
  context?: Partial<ErrorContext>
): Promise<HouseholdSingle> {
  const params: Record<string, any> = {};

  if (include) {
    params.include = include.join(',');
  }

  return getSingle<HouseholdResource>(client, `/households/${id}`, params, {
    ...context,
    endpoint: `/households/${id}`,
    householdId: id,
    method: 'GET',
  });
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
  },
  context?: Partial<ErrorContext>
): Promise<FieldDefinitionsList> {
  const queryParams: Record<string, any> = {};

  if (params?.include) {
    queryParams.include = params.include.join(',');
  }

  if (params?.per_page) {
    queryParams.per_page = params.per_page;
  }

  if (params?.page) {
    queryParams.page = params.page;
  }

  return getList<FieldDefinitionResource>(
    client,
    '/field_definitions',
    queryParams,
    {
      ...context,
      endpoint: '/field_definitions',
      method: 'GET',
    }
  );
}

/**
 * Get social profiles for a person
 */
export async function getPersonSocialProfiles(
  client: PcoClientState,
  personId: string,
  context?: Partial<ErrorContext>
): Promise<SocialProfilesList> {
  return getList<SocialProfileResource>(
    client,
    `/people/${personId}/social_profiles`,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/social_profiles`,
      method: 'GET',
      personId,
    }
  );
}

/**
 * Create a social profile for a person
 */
export async function createPersonSocialProfile(
  client: PcoClientState,
  personId: string,
  data: Partial<SocialProfileAttributes>,
  context?: Partial<ErrorContext>
): Promise<SocialProfileSingle> {
  return post<SocialProfileResource>(
    client,
    `/people/${personId}/social_profiles`,
    data,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/social_profiles`,
      method: 'POST',
      personId,
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
 * List notes for a workflow card
 */
export async function getWorkflowCardNotes(
  client: PcoClientState,
  personId: string,
  workflowCardId: string,
  context?: Partial<ErrorContext>
): Promise<WorkflowCardNotesList> {
  return getList<WorkflowCardNoteResource>(
    client,
    `/people/${personId}/workflow_cards/${workflowCardId}/notes`,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/workflow_cards/${workflowCardId}/notes`,
      method: 'GET',
      personId,
    }
  );
}

/**
 * Create a note for a workflow card
 */
export async function createWorkflowCardNote(
  client: PcoClientState,
  personId: string,
  workflowCardId: string,
  data: Partial<WorkflowCardNoteAttributes>,
  context?: Partial<ErrorContext>
): Promise<WorkflowCardNoteSingle> {
  return post<WorkflowCardNoteResource>(
    client,
    `/people/${personId}/workflow_cards/${workflowCardId}/notes`,
    data,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/workflow_cards/${workflowCardId}/notes`,
      method: 'POST',
      personId,
    }
  );
}

/**
 * List workflow cards for a person
 */
export async function getWorkflowCards(
  client: PcoClientState,
  personId: string,
  context?: Partial<ErrorContext>
): Promise<WorkflowCardsList> {
  return getList<WorkflowCardResource>(
    client,
    `/people/${personId}/workflow_cards`,
    undefined,
    {
      ...context,
      endpoint: `/people/${personId}/workflow_cards`,
      method: 'GET',
      personId,
    }
  );
}

/**
 * Create a workflow card in a workflow for a person
 */
export async function createWorkflowCard(
  client: PcoClientState,
  workflowId: string,
  personId: string,
  context?: Partial<ErrorContext>
): Promise<WorkflowCardSingle> {
  return post<WorkflowCardResource>(
    client,
    `/workflows/${workflowId}/cards`,
    { person_id: personId } as Partial<WorkflowCardAttributes>,
    undefined,
    {
      ...context,
      endpoint: `/workflows/${workflowId}/cards`,
      metadata: { ...(context?.metadata ?? {}), workflowId },
      method: 'POST',
      personId,
    }
  );
}

// ===== List API Functions =====

/**
 * Get all lists
 */
export async function getLists(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<ListsList> {
  return getList<ListResource>(client, '/lists', buildQueryParams(params), {
    ...context,
    endpoint: '/lists',
    method: 'GET',
  });
}

/**
 * Get a single list
 */
export async function getListById(
  client: PcoClientState,
  listId: string,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<ListSingle> {
  return getSingle<ListResource>(
    client,
    `/lists/${listId}`,
    buildQueryParams(params),
    {
      ...context,
      endpoint: `/lists/${listId}`,
      method: 'GET',
    }
  );
}

/**
 * Get all list categories
 */
export async function getListCategories(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<ListCategoriesList> {
  return getList<ListCategoryResource>(
    client,
    '/list_categories',
    buildQueryParams(params),
    {
      ...context,
      endpoint: '/list_categories',
      method: 'GET',
    }
  );
}

// ===== Note API Functions =====

/**
 * Get all notes
 */
export async function getNotes(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<NotesList> {
  return getList<NoteResource>(client, '/notes', buildQueryParams(params), {
    ...context,
    endpoint: '/notes',
    method: 'GET',
  });
}

/**
 * Get a single note
 */
export async function getNote(
  client: PcoClientState,
  noteId: string,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<NoteSingle> {
  return getSingle<NoteResource>(
    client,
    `/notes/${noteId}`,
    buildQueryParams(params),
    {
      ...context,
      endpoint: `/notes/${noteId}`,
      method: 'GET',
    }
  );
}

/**
 * Get all note categories
 */
export async function getNoteCategories(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<NoteCategoriesList> {
  return getList<NoteCategoryResource>(
    client,
    '/note_categories',
    buildQueryParams(params),
    {
      ...context,
      endpoint: '/note_categories',
      method: 'GET',
    }
  );
}

// ===== Workflow API Functions =====

/**
 * Get all workflows
 */
export async function getWorkflows(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<WorkflowsList> {
  return getList<WorkflowResource>(
    client,
    '/workflows',
    buildQueryParams(params),
    {
      ...context,
      endpoint: '/workflows',
      method: 'GET',
    }
  );
}

/**
 * Get a single workflow
 */
export async function getWorkflow(
  client: PcoClientState,
  workflowId: string,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<WorkflowSingle> {
  return getSingle<WorkflowResource>(
    client,
    `/workflows/${workflowId}`,
    buildQueryParams(params),
    {
      ...context,
      endpoint: `/workflows/${workflowId}`,
      method: 'GET',
    }
  );
}

// ===== Organization API Functions =====

/**
 * Get organization information
 */
export async function getOrganization(
  client: PcoClientState,
  params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
  },
  context?: Partial<ErrorContext>
): Promise<OrganizationSingle> {
  return getSingle<OrganizationResource>(
    client,
    '/',
    buildQueryParams(params),
    {
      ...context,
      endpoint: '/',
      method: 'GET',
    }
  );
}
