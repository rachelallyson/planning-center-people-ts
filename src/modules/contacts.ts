/**
 * v2.0.0 Contacts Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type {
    EmailResource,
    EmailAttributes,
    PhoneNumberResource,
    PhoneNumberAttributes,
    AddressResource,
    AddressAttributes,
    SocialProfileResource,
    SocialProfileAttributes
} from '../types';

export class ContactsModule extends BaseModule {
    /**
     * Get all emails
     */
    async getAllEmails(): Promise<{ data: EmailResource[]; meta?: any; links?: any }> {
        return this.getList<EmailResource>('/emails');
    }

    /**
     * Get a single email by ID
     */
    async getEmailById(id: string): Promise<EmailResource> {
        return this.getSingle<EmailResource>(`/emails/${id}`);
    }

    /**
     * Create an email
     */
    async createEmail(data: EmailAttributes): Promise<EmailResource> {
        return this.createResource<EmailResource>('/emails', data);
    }

    /**
     * Update an email
     */
    async updateEmail(id: string, data: Partial<EmailAttributes>): Promise<EmailResource> {
        return this.updateResource<EmailResource>(`/emails/${id}`, data);
    }

    /**
     * Delete an email
     */
    async deleteEmail(id: string): Promise<void> {
        return this.deleteResource(`/emails/${id}`);
    }

    /**
     * Get all phone numbers
     */
    async getAllPhoneNumbers(): Promise<{ data: PhoneNumberResource[]; meta?: any; links?: any }> {
        return this.getList<PhoneNumberResource>('/phone_numbers');
    }

    /**
     * Get a single phone number by ID
     */
    async getPhoneNumberById(id: string): Promise<PhoneNumberResource> {
        return this.getSingle<PhoneNumberResource>(`/phone_numbers/${id}`);
    }

    /**
     * Create a phone number
     */
    async createPhoneNumber(data: PhoneNumberAttributes): Promise<PhoneNumberResource> {
        return this.createResource<PhoneNumberResource>('/phone_numbers', data);
    }

    /**
     * Update a phone number
     */
    async updatePhoneNumber(id: string, data: Partial<PhoneNumberAttributes>): Promise<PhoneNumberResource> {
        return this.updateResource<PhoneNumberResource>(`/phone_numbers/${id}`, data);
    }

    /**
     * Delete a phone number
     */
    async deletePhoneNumber(id: string): Promise<void> {
        return this.deleteResource(`/phone_numbers/${id}`);
    }

    /**
     * Get all addresses
     */
    async getAllAddresses(): Promise<{ data: AddressResource[]; meta?: any; links?: any }> {
        return this.getList<AddressResource>('/addresses');
    }

    /**
     * Get a single address by ID
     */
    async getAddressById(id: string): Promise<AddressResource> {
        return this.getSingle<AddressResource>(`/addresses/${id}`);
    }

    /**
     * Create an address
     */
    async createAddress(data: AddressAttributes): Promise<AddressResource> {
        return this.createResource<AddressResource>('/addresses', data);
    }

    /**
     * Update an address
     */
    async updateAddress(id: string, data: Partial<AddressAttributes>): Promise<AddressResource> {
        return this.updateResource<AddressResource>(`/addresses/${id}`, data);
    }

    /**
     * Delete an address
     */
    async deleteAddress(id: string): Promise<void> {
        return this.deleteResource(`/addresses/${id}`);
    }

    /**
     * Get all social profiles
     */
    async getAllSocialProfiles(): Promise<{ data: SocialProfileResource[]; meta?: any; links?: any }> {
        return this.getList<SocialProfileResource>('/social_profiles');
    }

    /**
     * Get a single social profile by ID
     */
    async getSocialProfileById(id: string): Promise<SocialProfileResource> {
        return this.getSingle<SocialProfileResource>(`/social_profiles/${id}`);
    }

    /**
     * Create a social profile
     */
    async createSocialProfile(data: SocialProfileAttributes): Promise<SocialProfileResource> {
        return this.createResource<SocialProfileResource>('/social_profiles', data);
    }

    /**
     * Update a social profile
     */
    async updateSocialProfile(id: string, data: Partial<SocialProfileAttributes>): Promise<SocialProfileResource> {
        return this.updateResource<SocialProfileResource>(`/social_profiles/${id}`, data);
    }

    /**
     * Delete a social profile
     */
    async deleteSocialProfile(id: string): Promise<void> {
        return this.deleteResource(`/social_profiles/${id}`);
    }
}
