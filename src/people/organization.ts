import { getSingle, PcoClientState } from '../core';
import type { ErrorContext } from '../error-handling';
import { buildQueryParams } from '../helpers';
import {
    OrganizationResource,
    OrganizationSingle,
} from '../types';

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
