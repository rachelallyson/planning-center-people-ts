import { getList, getSingle, PcoClientState } from '../core';
import type { ErrorContext } from '../error-handling';
import { buildQueryParams } from '../helpers';
import {
    HouseholdResource,
    HouseholdSingle,
    HouseholdsList,
} from '../types';

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
    return getList<HouseholdResource>(client, '/households', buildQueryParams(params), {
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
