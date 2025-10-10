/**
 * v2.0.0 People Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    PersonResource,
    PersonAttributes,
    EmailResource,
    EmailAttributes,
    PhoneNumberResource,
    PhoneNumberAttributes,
    AddressResource,
    AddressAttributes,
    SocialProfileResource,
    SocialProfileAttributes
} from '../types';
import { PersonMatcher } from '../matching/matcher';

export interface PeopleListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export interface PersonCreateOptions {
    firstName?: string;
    lastName?: string;
    givenName?: string;
    middleName?: string;
    nickname?: string;
    birthdate?: string;
    anniversary?: string;
    gender?: string;
    grade?: string;
    child?: boolean;
    status?: string;
    medicalNotes?: string;
    jobTitle?: string;
    employer?: string;
    school?: string;
    graduationYear?: string;
    avatar?: string;
    siteAdministrator?: boolean;
    accountingAdministrator?: boolean;
    peoplePermissions?: string;
    directoryStatus?: string;
    loginIdentifier?: string;
    membership?: string;
    remoteId?: string;
    demographicAvatarUrl?: string;
    inactivatedAt?: string;
    resourcePermissionFlags?: Record<string, boolean>;
}

export interface PersonMatchOptions {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    matchStrategy?: 'exact' | 'fuzzy' | 'aggressive';
    campus?: string;
    createIfNotFound?: boolean;
}

export class PeopleModule extends BaseModule {
    private personMatcher: PersonMatcher;

    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
        this.personMatcher = new PersonMatcher(this);
    }

    /**
     * Get all people with optional filtering
     */
    async getAll(options: PeopleListOptions = {}): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<PersonResource>('/people', params);
    }

    /**
     * Get all people across all pages
     */
    async getAllPagesPaginated(options: PeopleListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<PersonResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<PersonResource>('/people', params, paginationOptions);
    }

    /**
     * Get a single person by ID
     */
    async getById(id: string, include?: string[]): Promise<PersonResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<PersonResource>(`/people/${id}`, params);
    }

    /**
     * Create a new person
     */
    async create(data: PersonCreateOptions): Promise<PersonResource> {
        return this.createResource<PersonResource>('/people', data);
    }

    /**
     * Update a person
     */
    async update(id: string, data: Partial<PersonCreateOptions>): Promise<PersonResource> {
        return this.updateResource<PersonResource>(`/people/${id}`, data);
    }

    /**
     * Delete a person
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/people/${id}`);
    }

    /**
     * Find or create a person with smart matching
     */
    async findOrCreate(options: PersonMatchOptions): Promise<PersonResource> {
        return this.personMatcher.findOrCreate(options);
    }

    /**
     * Search people by multiple criteria
     */
    async search(criteria: {
        name?: string;
        email?: string;
        phone?: string;
        status?: string;
        perPage?: number;
    }): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        const where: Record<string, any> = {};

        if (criteria.name) {
            where.name = criteria.name;
        }

        if (criteria.email) {
            where.email = criteria.email;
        }

        if (criteria.phone) {
            where.phone = criteria.phone;
        }

        if (criteria.status) {
            where.status = criteria.status;
        }

        return this.getAll({
            where,
            perPage: criteria.perPage || 25,
        });
    }

    // Contact methods

    /**
     * Get person's emails
     */
    async getEmails(personId: string): Promise<{ data: EmailResource[]; meta?: any; links?: any }> {
        return this.getList<EmailResource>(`/people/${personId}/emails`);
    }

    /**
     * Add an email to a person
     */
    async addEmail(personId: string, data: EmailAttributes): Promise<EmailResource> {
        return this.createResource<EmailResource>(`/people/${personId}/emails`, data);
    }

    /**
     * Update a person's email
     */
    async updateEmail(personId: string, emailId: string, data: Partial<EmailAttributes>): Promise<EmailResource> {
        return this.updateResource<EmailResource>(`/people/${personId}/emails/${emailId}`, data);
    }

    /**
     * Delete a person's email
     */
    async deleteEmail(personId: string, emailId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/emails/${emailId}`);
    }

    /**
     * Get person's phone numbers
     */
    async getPhoneNumbers(personId: string): Promise<{ data: PhoneNumberResource[]; meta?: any; links?: any }> {
        return this.getList<PhoneNumberResource>(`/people/${personId}/phone_numbers`);
    }

    /**
     * Add a phone number to a person
     */
    async addPhoneNumber(personId: string, data: PhoneNumberAttributes): Promise<PhoneNumberResource> {
        return this.createResource<PhoneNumberResource>(`/people/${personId}/phone_numbers`, data);
    }

    /**
     * Update a person's phone number
     */
    async updatePhoneNumber(personId: string, phoneId: string, data: Partial<PhoneNumberAttributes>): Promise<PhoneNumberResource> {
        return this.updateResource<PhoneNumberResource>(`/people/${personId}/phone_numbers/${phoneId}`, data);
    }

    /**
     * Delete a person's phone number
     */
    async deletePhoneNumber(personId: string, phoneId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/phone_numbers/${phoneId}`);
    }

    /**
     * Get person's addresses
     */
    async getAddresses(personId: string): Promise<{ data: AddressResource[]; meta?: any; links?: any }> {
        return this.getList<AddressResource>(`/people/${personId}/addresses`);
    }

    /**
     * Add an address to a person
     */
    async addAddress(personId: string, data: AddressAttributes): Promise<AddressResource> {
        return this.createResource<AddressResource>(`/people/${personId}/addresses`, data);
    }

    /**
     * Update a person's address
     */
    async updateAddress(personId: string, addressId: string, data: Partial<AddressAttributes>): Promise<AddressResource> {
        return this.updateResource<AddressResource>(`/people/${personId}/addresses/${addressId}`, data);
    }

    /**
     * Delete a person's address
     */
    async deleteAddress(personId: string, addressId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/addresses/${addressId}`);
    }

    /**
     * Get person's social profiles
     */
    async getSocialProfiles(personId: string): Promise<{ data: SocialProfileResource[]; meta?: any; links?: any }> {
        return this.getList<SocialProfileResource>(`/people/${personId}/social_profiles`);
    }

    /**
     * Add a social profile to a person
     */
    async addSocialProfile(personId: string, data: SocialProfileAttributes): Promise<SocialProfileResource> {
        return this.createResource<SocialProfileResource>(`/people/${personId}/social_profiles`, data);
    }

    /**
     * Update a person's social profile
     */
    async updateSocialProfile(personId: string, profileId: string, data: Partial<SocialProfileAttributes>): Promise<SocialProfileResource> {
        return this.updateResource<SocialProfileResource>(`/people/${personId}/social_profiles/${profileId}`, data);
    }

    /**
     * Delete a person's social profile
     */
    async deleteSocialProfile(personId: string, profileId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/social_profiles/${profileId}`);
    }

    /**
     * Create a person with contact information
     */
    async createWithContacts(
        personData: PersonCreateOptions,
        contacts?: {
            email?: EmailAttributes;
            phone?: PhoneNumberAttributes;
            address?: AddressAttributes;
        }
    ): Promise<{
        person: PersonResource;
        email?: EmailResource;
        phone?: PhoneNumberResource;
        address?: AddressResource;
    }> {
        const person = await this.create(personData);
        const result: any = { person };

        if (contacts?.email) {
            result.email = await this.addEmail(person.id, contacts.email);
        }

        if (contacts?.phone) {
            result.phone = await this.addPhoneNumber(person.id, contacts.phone);
        }

        if (contacts?.address) {
            result.address = await this.addAddress(person.id, contacts.address);
        }

        return result;
    }
}
