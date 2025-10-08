/**
 * Helper Functions for Common PCO People API Operations
 *
 * This module provides convenient helper functions for common operations
 * that combine multiple API calls or provide higher-level abstractions.
 */

import type { PcoClientState } from './core';
import {
  createPerson,
  createPersonAddress,
  createPersonEmail,
  createPersonPhoneNumber,
  createWorkflowCard,
  createWorkflowCardNote,
  getHouseholds,
  getLists,
  getNotes,
  getOrganization,
  getPeople,
  getPerson,
  getPersonAddresses,
  getPersonEmails,
  getPersonFieldData,
  getPersonPhoneNumbers,
  getPersonSocialProfiles,
  getWorkflowCardNotes,
  getWorkflowCards,
  getWorkflows,
} from './people';
import type {
  AddressResource,
  EmailResource,
  FieldDatumResource,
  ListResource,
  NoteResource,
  OrganizationResource,
  PersonResource,
  PhoneNumberResource,
  SocialProfileResource,
  WorkflowCardNoteResource,
  WorkflowCardResource,
} from './types';

// ===== Person Management Helpers =====

/**
 * Get a complete person profile with all related data
 */
export async function getCompletePersonProfile(
  client: PcoClientState,
  personId: string
): Promise<{
  person: PersonResource;
  emails: EmailResource[];
  phoneNumbers: PhoneNumberResource[];
  addresses: AddressResource[];
  socialProfiles: SocialProfileResource[];
  fieldData: FieldDatumResource[];
  workflowCards: WorkflowCardResource[];
  notes: NoteResource[];
}> {
  const [
    personResponse,
    emailsResponse,
    phoneNumbersResponse,
    addressesResponse,
    socialProfilesResponse,
    fieldDataResponse,
    workflowCardsResponse,
    notesResponse,
  ] = await Promise.all([
    getPerson(client, personId),
    getPersonEmails(client, personId),
    getPersonPhoneNumbers(client, personId),
    getPersonAddresses(client, personId),
    getPersonSocialProfiles(client, personId),
    getPersonFieldData(client, personId),
    getWorkflowCards(client, personId),
    getNotes(client, { where: { person_id: personId } }),
  ]);

  if (!personResponse.data) {
    throw new Error(`Person with ID ${personId} not found`);
  }

  return {
    addresses: addressesResponse.data,
    emails: emailsResponse.data,
    fieldData: fieldDataResponse.data,
    notes: notesResponse.data,
    person: personResponse.data,
    phoneNumbers: phoneNumbersResponse.data,
    socialProfiles: socialProfilesResponse.data,
    workflowCards: workflowCardsResponse.data,
  };
}

/**
 * Create a person with initial contact information
 */
export async function createPersonWithContact(
  client: PcoClientState,
  personData: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address?: {
      address1: string;
      city: string;
      state: string;
      zip: string;
    };
  }
): Promise<{
  person: PersonResource;
  email?: EmailResource;
  phone?: PhoneNumberResource;
  address?: AddressResource;
}> {
  // Create the person first
  const personResponse = await createPerson(client, {
    first_name: personData.first_name,
    last_name: personData.last_name,
  });

  if (!personResponse.data) {
    throw new Error('Failed to create person');
  }

  const personId = personResponse.data.id;
  const results: any = { person: personResponse.data };

  // Add email if provided
  if (personData.email) {
    const emailResponse = await createPersonEmail(client, personId, {
      address: personData.email,
      location: 'Home',
      primary: true,
    });

    results.email = emailResponse.data;
  }

  // Add phone if provided
  if (personData.phone) {
    const phoneResponse = await createPersonPhoneNumber(client, personId, {
      location: 'Mobile',
      number: personData.phone,
      primary: true,
    });

    results.phone = phoneResponse.data;
  }

  // Add address if provided
  if (personData.address) {
    const addressResponse = await createPersonAddress(client, personId, {
      ...personData.address,
      location: 'Home',
      primary: true,
    });

    results.address = addressResponse.data;
  }

  return results;
}

/**
 * Search for people by multiple criteria
 */
export async function searchPeople(
  client: PcoClientState,
  criteria: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    household?: string;
  }
): Promise<PersonResource[]> {
  const whereConditions: Record<string, any> = {};

  if (criteria.name) {
    whereConditions.name = criteria.name;
  }
  if (criteria.email) {
    whereConditions.email = criteria.email;
  }
  if (criteria.phone) {
    whereConditions.phone = criteria.phone;
  }
  if (criteria.status) {
    whereConditions.status = criteria.status;
  }
  if (criteria.household) {
    whereConditions.household = criteria.household;
  }

  const response = await getPeople(client, {
    include: ['emails', 'phone_numbers', 'household'],
    where: whereConditions,
  });

  return response.data;
}

/**
 * Get people by household
 */
export async function getPeopleByHousehold(
  client: PcoClientState,
  householdId: string
): Promise<PersonResource[]> {
  const response = await getPeople(client, {
    include: ['emails', 'phone_numbers', 'addresses'],
    where: { household_id: householdId },
  });

  return response.data;
}

// ===== Workflow Management Helpers =====

/**
 * Get all workflow cards for a person with their notes
 */
export async function getPersonWorkflowCardsWithNotes(
  client: PcoClientState,
  personId: string
): Promise<(WorkflowCardResource & { notes: WorkflowCardNoteResource[] })[]> {
  const workflowCardsResponse = await getWorkflowCards(client, personId);

  const cardsWithNotes = await Promise.all(
    workflowCardsResponse.data.map(async card => {
      const notesResponse = await getWorkflowCardNotes(
        client,
        personId,
        card.id
      );

      return {
        ...card,
        notes: notesResponse.data,
      };
    })
  );

  return cardsWithNotes;
}

/**
 * Create a workflow card with an initial note
 */
export async function createWorkflowCardWithNote(
  client: PcoClientState,
  personId: string,
  workflowId: string,
  cardData: {
    title: string;
    description?: string;
    initialNote?: string;
  }
): Promise<{
  card: WorkflowCardResource;
  note?: WorkflowCardNoteResource;
}> {
  const cardResponse = await createWorkflowCard(client, workflowId, personId);

  if (!cardResponse.data) {
    throw new Error('Failed to create workflow card');
  }

  const results: any = { card: cardResponse.data };

  if (cardData.initialNote) {
    const noteResponse = await createWorkflowCardNote(
      client,
      personId,
      cardResponse.data.id,
      { note: cardData.initialNote }
    );

    results.note = noteResponse.data;
  }

  return results;
}

// ===== List Management Helpers =====

/**
 * Get all lists with their categories
 */
export async function getListsWithCategories(
  client: PcoClientState
): Promise<(ListResource & { category?: any })[]> {
  const [listsResponse, categoriesResponse] = await Promise.all([
    getLists(client, { include: ['category'] }),
    getLists(client), // This should be getListCategories when available
  ]);

  // For now, return lists with basic category info
  return listsResponse.data.map(list => ({
    ...list,
    category: list.relationships?.category?.data,
  }));
}

// ===== Organization Helpers =====

/**
 * Get organization information with statistics
 */
export async function getOrganizationInfo(client: PcoClientState): Promise<{
  organization: OrganizationResource;
  stats: {
    totalPeople: number;
    totalHouseholds: number;
    totalLists: number;
    totalWorkflows: number;
  };
}> {
  const [
    organizationResponse,
    peopleResponse,
    householdsResponse,
    listsResponse,
    workflowsResponse,
  ] = await Promise.all([
    getOrganization(client),
    getPeople(client, { per_page: 1 }),
    getHouseholds(client, { per_page: 1 }),
    getLists(client, { per_page: 1 }),
    getWorkflows(client, { per_page: 1 }),
  ]);

  if (!organizationResponse.data) {
    throw new Error('Failed to get organization data');
  }

  return {
    organization: organizationResponse.data,
    stats: {
      totalHouseholds: Number(householdsResponse.meta?.total_count) || 0,
      totalLists: Number(listsResponse.meta?.total_count) || 0,
      totalPeople: Number(peopleResponse.meta?.total_count) || 0,
      totalWorkflows: Number(workflowsResponse.meta?.total_count) || 0,
    },
  };
}

// ===== Data Export Helpers =====

/**
 * Export all people data to a structured format
 */
export async function exportAllPeopleData(
  client: PcoClientState,
  options: {
    includeInactive?: boolean;
    includeFieldData?: boolean;
    includeWorkflowCards?: boolean;
    batchSize?: number;
  } = {}
): Promise<
  {
    person: PersonResource;
    emails: EmailResource[];
    phoneNumbers: PhoneNumberResource[];
    addresses: AddressResource[];
    socialProfiles: SocialProfileResource[];
    fieldData?: FieldDatumResource[];
    workflowCards?: WorkflowCardResource[];
  }[]
> {
  const {
    batchSize = 50,
    includeFieldData = false,
    includeInactive = false,
    includeWorkflowCards = false,
  } = options;

  const whereConditions: Record<string, any> = {};

  if (!includeInactive) {
    whereConditions.status = 'active';
  }

  const includeArray = [
    'emails',
    'phone_numbers',
    'addresses',
    'social_profiles',
  ];

  if (includeFieldData) {
    includeArray.push('field_data');
  }
  if (includeWorkflowCards) {
    includeArray.push('workflow_cards');
  }

  let allPeople: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getPeople(client, {
      include: includeArray,
      page,
      per_page: batchSize,
      where: whereConditions,
    });

    allPeople = allPeople.concat(response.data);

    hasMore = response.links?.next ? true : false;
    page++;
  }

  return allPeople.map(person => ({
    addresses: person.relationships?.addresses?.data || [],
    emails: person.relationships?.emails?.data || [],
    person,
    phoneNumbers: person.relationships?.phone_numbers?.data || [],
    socialProfiles: person.relationships?.social_profiles?.data || [],
    ...(includeFieldData && {
      fieldData: person.relationships?.field_data?.data || [],
    }),
    ...(includeWorkflowCards && {
      workflowCards: person.relationships?.workflow_cards?.data || [],
    }),
  }));
}

// ===== Validation Helpers =====

/**
 * Validate person data before creation/update
 */
export function validatePersonData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.first_name && !data.last_name) {
    errors.push('Either first_name or last_name is required');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone format');
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

/**
 * Validate phone format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// ===== Utility Helpers =====

/**
 * Format person name for display
 */
export function formatPersonName(person: PersonResource): string {
  const attrs = person.attributes;

  if (attrs?.first_name && attrs?.last_name) {
    return `${attrs.first_name} ${attrs.last_name}`;
  }
  if (attrs?.first_name) {
    return attrs.first_name;
  }
  if (attrs?.last_name) {
    return attrs.last_name;
  }
  if (attrs?.name) {
    return attrs.name;
  }

  return 'Unknown';
}

/**
 * Get primary contact information for a person
 */
export function getPrimaryContact(
  person: PersonResource,
  relatedData: {
    emails?: EmailResource[];
    phoneNumbers?: PhoneNumberResource[];
  }
): {
  email?: string;
  phone?: string;
} {
  const primaryEmail = relatedData.emails?.find(
    email => email.attributes?.primary
  );
  const primaryPhone = relatedData.phoneNumbers?.find(
    phone => phone.attributes?.primary
  );

  return {
    email: primaryEmail?.attributes?.address,
    phone: primaryPhone?.attributes?.number,
  };
}

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: string): number | null {
  if (!birthdate) return null;

  const birth = new Date(birthdate);
  const today = new Date();

  if (isNaN(birth.getTime())) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format date for display
 */
export function formatDate(
  dateString: string,
  format: 'short' | 'long' | 'iso' = 'short'
): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'iso':
      return date.toISOString();
    default:
      return dateString;
  }
}
