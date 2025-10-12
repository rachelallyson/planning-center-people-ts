import type { PcoClientState } from './core';
import type { ErrorContext } from './error-handling';
import {
    getPeople,
    getPerson,
    createPerson,
    createPersonEmail,
    createPersonPhoneNumber,
    createPersonAddress,
    getPersonEmails,
    getPersonPhoneNumbers,
    getPersonAddresses,
    getPersonFieldData,
    getWorkflowCards,
    createWorkflowCard,
    getWorkflowCardNotes,
    createWorkflowCardNote,
    getLists,
    getListCategories,
    getOrganization,
    getHouseholds,
} from './people';
import type {
    PersonAttributes,
    EmailAttributes,
    PhoneNumberAttributes,
    AddressAttributes,
    WorkflowCardNoteAttributes,
    PeopleList,
    PersonSingle,
    EmailSingle,
    PhoneNumberSingle,
    AddressSingle,
    WorkflowCardSingle,
    WorkflowCardNoteSingle,
    ListsList,
    ListCategoriesList,
    OrganizationSingle,
    HouseholdsList,
} from './types';

/**
 * Transform complex params object into flat query params for API calls
 */
export function buildQueryParams(params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
    filter?: string;
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

    if (params?.filter) {
        queryParams.filter = params.filter;
    }

    return queryParams;
}

/**
 * Calculate age from birthdate string
 */
export function calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Calculate age from birthdate string, handling invalid dates
 */
export function calculateAgeSafe(birthdate: string | undefined): number | null {
    if (!birthdate) return null;

    try {
        const birth = new Date(birthdate);
        if (isNaN(birth.getTime())) return null;

        return calculateAge(birthdate);
    } catch {
        return null;
    }
}

/**
 * Check if a person is an adult (18+ years old)
 */
export function isAdult(birthdate: string | undefined): boolean {
    const age = calculateAgeSafe(birthdate);
    return age !== null && age >= 18;
}

/**
 * Check if a person is a child (under 18 years old)
 */
export function isChild(birthdate: string | undefined): boolean {
    const age = calculateAgeSafe(birthdate);
    return age !== null && age < 18;
}

/**
 * Check if a person's age matches the given criteria
 */
export function matchesAgeCriteria(
    birthdate: string | undefined,
    criteria: {
        agePreference?: 'adults' | 'children' | 'any';
        minAge?: number;
        maxAge?: number;
        birthYear?: number;
    }
): boolean {
    const age = calculateAgeSafe(birthdate);

    // If no birthdate, only match if preference is 'any'
    if (age === null) {
        return criteria.agePreference === 'any' || criteria.agePreference === undefined;
    }

    // Check age preference
    if (criteria.agePreference === 'adults' && age < 18) return false;
    if (criteria.agePreference === 'children' && age >= 18) return false;

    // Check age range
    if (criteria.minAge !== undefined && age < criteria.minAge) return false;
    if (criteria.maxAge !== undefined && age > criteria.maxAge) return false;

    // Check birth year
    if (criteria.birthYear !== undefined) {
        const birthYear = new Date(birthdate!).getFullYear();
        if (birthYear !== criteria.birthYear) return false;
    }

    return true;
}

/**
 * Calculate birth year from age
 */
export function calculateBirthYearFromAge(age: number): number {
    const currentYear = new Date().getFullYear();
    return currentYear - age;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{6,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Format person name from attributes
 */
export function formatPersonName(person: { first_name?: string; last_name?: string; nickname?: string }): string {
    const firstName = person.nickname || person.first_name || '';
    const lastName = person.last_name || '';

    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    } else if (firstName) {
        return firstName;
    } else if (lastName) {
        return lastName;
    }

    return 'Unknown';
}

/**
 * Format date string in various formats
 */
export function formatDate(dateString: string, format: 'short' | 'long' | 'iso' = 'short'): string {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    switch (format) {
        case 'short':
            return date.toLocaleDateString();
        case 'long':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'iso':
            return date.toISOString().split('T')[0];
        default:
            return date.toLocaleDateString();
    }
}

/**
 * Validate person data
 */
export function validatePersonData(data: Partial<PersonAttributes>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.email && typeof data.email === 'string' && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }

    if (data.phone && typeof data.phone === 'string' && !isValidPhone(data.phone)) {
        errors.push('Invalid phone format');
    }

    if (data.birthdate) {
        const birthDate = new Date(data.birthdate);
        if (isNaN(birthDate.getTime())) {
            errors.push('Invalid birthdate format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get primary contact information for a person
 */
export async function getPrimaryContact(
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<{
    email?: string;
    phone?: string;
    address?: string;
}> {
    const [emails, phones, addresses] = await Promise.all([
        getPersonEmails(client, personId, context),
        getPersonPhoneNumbers(client, personId, context),
        getPersonAddresses(client, personId, context)
    ]);

    const primaryEmail = emails.data.find((e: any) => e.attributes.primary);
    const primaryPhone = phones.data.find((p: any) => p.attributes.primary);
    const primaryAddress = addresses.data.find((a: any) => a.attributes.primary);

    return {
        email: primaryEmail?.attributes?.address || emails.data[0]?.attributes?.address,
        phone: primaryPhone?.attributes?.number || phones.data[0]?.attributes?.number,
        address: (primaryAddress?.attributes?.street || addresses.data[0]?.attributes?.street) as string | undefined
    };
}

/**
 * Create a person with contact information
 */
export async function createPersonWithContact(
    client: PcoClientState,
    personData: Partial<PersonAttributes>,
    contactData?: {
        email?: Partial<EmailAttributes>;
        phone?: Partial<PhoneNumberAttributes>;
        address?: Partial<AddressAttributes>;
    },
    context?: Partial<ErrorContext>
): Promise<{
    person: PersonSingle;
    email?: EmailSingle;
    phone?: PhoneNumberSingle;
    address?: AddressSingle;
}> {
    const person = await createPerson(client, personData, context);

    const results: any = { person };

    if (contactData?.email) {
        results.email = await createPersonEmail(client, person.data!.id, contactData.email, context);
    }

    if (contactData?.phone) {
        results.phone = await createPersonPhoneNumber(client, person.data!.id, contactData.phone, context);
    }

    if (contactData?.address) {
        results.address = await createPersonAddress(client, person.data!.id, contactData.address, context);
    }

    return results;
}

/**
 * Search people by multiple criteria
 */
export async function searchPeople(
    client: PcoClientState,
    criteria: {
        status?: string;
        name?: string;
        email?: string;
        per_page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<PeopleList> {
    const where: Record<string, any> = {};

    if (criteria.status) {
        where.status = criteria.status;
    }

    if (criteria.name) {
        where.name = criteria.name;
    }

    if (criteria.email) {
        where.email = criteria.email;
    }

    return getPeople(client, {
        where,
        per_page: criteria.per_page || 25
    }, context);
}

/**
 * Get people by household
 */
export async function getPeopleByHousehold(
    client: PcoClientState,
    householdId: string,
    context?: Partial<ErrorContext>
): Promise<PeopleList> {
    return getPeople(client, {
        where: { household_id: householdId },
        include: ['household']
    }, context);
}

/**
 * Get complete person profile with all related data
 */
export async function getCompletePersonProfile(
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<{
    person: PersonSingle;
    emails: any;
    phones: any;
    addresses: any;
    fieldData: any;
    workflowCards: any;
}> {
    const [person, emails, phones, addresses, fieldData, workflowCards] = await Promise.all([
        getPerson(client, personId, ['household'], context),
        getPersonEmails(client, personId, context),
        getPersonPhoneNumbers(client, personId, context),
        getPersonAddresses(client, personId, context),
        getPersonFieldData(client, personId, context),
        getWorkflowCards(client, personId, context)
    ]);

    return {
        person,
        emails,
        phones,
        addresses,
        fieldData,
        workflowCards
    };
}

/**
 * Get organization info with statistics
 */
export async function getOrganizationInfo(
    client: PcoClientState,
    context?: Partial<ErrorContext>
): Promise<{
    organization: OrganizationSingle;
    stats: {
        totalPeople: number;
        totalHouseholds: number;
        totalLists: number;
    };
}> {
    const [organization, people, households, lists] = await Promise.all([
        getOrganization(client, undefined, context),
        getPeople(client, { per_page: 1 }, context),
        getHouseholds(client, { per_page: 1 }, context),
        getLists(client, { per_page: 1 }, context)
    ]);

    return {
        organization,
        stats: {
            totalPeople: Number(people.meta?.total_count) || 0,
            totalHouseholds: Number(households.meta?.total_count) || 0,
            totalLists: Number(lists.meta?.total_count) || 0
        }
    };
}

/**
 * Get lists with their categories
 */
export async function getListsWithCategories(
    client: PcoClientState,
    context?: Partial<ErrorContext>
): Promise<{
    lists: ListsList;
    categories: ListCategoriesList;
}> {
    const [lists, categories] = await Promise.all([
        getLists(client, { include: ['list_category'] }, context),
        getListCategories(client, undefined, context)
    ]);

    return { lists, categories };
}

/**
 * Get workflow cards with notes for a person
 */
export async function getPersonWorkflowCardsWithNotes(
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<{
    workflowCards: any;
    notes: { [cardId: string]: any };
}> {
    const workflowCards = await getWorkflowCards(client, personId, context);

    const notes: { [cardId: string]: any } = {};

    for (const card of workflowCards.data) {
        try {
            notes[card.id] = await getWorkflowCardNotes(client, personId, card.id, context);
        } catch (error) {
            notes[card.id] = { data: [], meta: { total_count: 0 } };
        }
    }

    return { workflowCards, notes };
}

/**
 * Create a workflow card with a note
 */
export async function createWorkflowCardWithNote(
    client: PcoClientState,
    workflowId: string,
    personId: string,
    noteData: Partial<WorkflowCardNoteAttributes>,
    context?: Partial<ErrorContext>
): Promise<{
    workflowCard: WorkflowCardSingle;
    note: WorkflowCardNoteSingle;
}> {
    const workflowCard = await createWorkflowCard(client, workflowId, personId, context);

    const note = await createWorkflowCardNote(
        client,
        personId,
        workflowCard.data!.id,
        noteData,
        context
    );

    return { workflowCard, note };
}

/**
 * Export all people data in a structured format
 */
export async function exportAllPeopleData(
    client: PcoClientState,
    options: {
        includeInactive?: boolean;
        includeFieldData?: boolean;
        includeWorkflowCards?: boolean;
        perPage?: number;
    } = {},
    context?: Partial<ErrorContext>
): Promise<{
    people: any[];
    households: any[];
    lists: any[];
    organization: any;
    exportDate: string;
    totalCount: number;
}> {
    const { includeInactive = false, includeFieldData = false, includeWorkflowCards = false, perPage = 100 } = options;

    const where: Record<string, any> = {};
    if (!includeInactive) {
        where.status = 'active';
    }

    const include: string[] = ['household'];
    if (includeFieldData) {
        include.push('field_data');
    }
    if (includeWorkflowCards) {
        include.push('workflow_cards');
    }

    const [people, households, lists, organization] = await Promise.all([
        getPeople(client, { where, include, per_page: perPage }, context),
        getHouseholds(client, { per_page: perPage }, context),
        getLists(client, { per_page: perPage }, context),
        getOrganization(client, undefined, context)
    ]);

    return {
        people: people.data,
        households: households.data,
        lists: lists.data,
        organization: organization.data,
        exportDate: new Date().toISOString(),
        totalCount: Number(people.meta?.total_count) || 0
    };
}

// ===== File Handling Utilities =====

/**
 * Extracts clean URL from HTML markup that contains file links
 * Handles cases like: <a href="https://onark.s3.us-east-1.amazonaws.com/file.pdf" download>View File: https://onark.s3.us-east-1.amazonaws.com/file.pdf</a>
 */
export function extractFileUrl(value: string): string {
    // If it's already a clean URL, return it
    if (value.startsWith('http') && !value.includes('<')) {
        return value;
    }

    // Extract URL from HTML anchor tag
    const hrefMatch = /href=["']([^"']+)["']/.exec(value);

    if (hrefMatch) {
        return hrefMatch[1];
    }

    // Extract URL from text content (fallback)
    const urlMatch = /(https?:\/\/[^\s<>"']+)/.exec(value);

    if (urlMatch) {
        return urlMatch[1];
    }

    // If no URL found, return original value
    return value;
}

/**
 * Determines if a value contains a file URL
 */
export function isFileUrl(value: string): boolean {
    const cleanUrl = extractFileUrl(value);

    return (
        cleanUrl.includes('s3.') ||
        cleanUrl.includes('amazonaws.com') ||
        cleanUrl.includes('onark.s3.')
    );
}

/**
 * Gets file extension from URL
 */
export function getFileExtension(url: string): string {
    const cleanUrl = extractFileUrl(url);
    const match = /\.([a-zA-Z0-9]+)(?:[?#]|$)/.exec(cleanUrl);

    return match ? match[1].toLowerCase() : '';
}

/**
 * Gets filename from URL
 */
export function getFilename(url: string): string {
    const cleanUrl = extractFileUrl(url);
    const urlParts = cleanUrl.split('/');

    return urlParts[urlParts.length - 1] || 'file';
}

/**
 * Determines if a field value represents a file upload
 */
export function isFileUpload(value: string): boolean {
    return isFileUrl(value) || value.includes('<a href=');
}

/**
 * Gets MIME type from file extension
 */
function getMimeType(extension: string): string {
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

    return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Processes file upload value for PCO field
 * Returns clean URL for text fields, or file data for file fields
 */
export function processFileValue(
    value: string,
    fieldType: 'text' | 'file' = 'text'
): string | { url: string; filename: string; contentType: string } {
    const cleanUrl = extractFileUrl(value);

    if (fieldType === 'text') {
        return cleanUrl;
    }

    // For file fields, return metadata object
    const extension = getFileExtension(cleanUrl);
    const filename = getFilename(cleanUrl);
    const contentType = getMimeType(extension);

    return {
        contentType,
        filename,
        url: cleanUrl,
    };
}

