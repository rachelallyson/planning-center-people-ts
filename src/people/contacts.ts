import { del, getList, patch, PcoClientState, post } from '../core';
import type { ErrorContext } from '../error-handling';
import {
    AddressAttributes,
    AddressesList,
    AddressResource,
    AddressSingle,
    EmailAttributes,
    EmailResource,
    EmailSingle,
    EmailsList,
    PhoneNumberAttributes,
    PhoneNumberResource,
    PhoneNumberSingle,
    PhoneNumbersList,
    SocialProfileAttributes,
    SocialProfileResource,
    SocialProfileSingle,
    SocialProfilesList,
} from '../types';

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
 * Delete a social profile
 */
export async function deleteSocialProfile(
    client: PcoClientState,
    socialProfileId: string,
    context?: Partial<ErrorContext>
): Promise<void> {
    return del(
        client,
        `/social_profiles/${socialProfileId}`,
        {
            ...context,
            endpoint: `/social_profiles/${socialProfileId}`,
            method: 'DELETE',
        }
    );
}
