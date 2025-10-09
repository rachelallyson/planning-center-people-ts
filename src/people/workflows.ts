import { getList, getSingle, PcoClientState, post } from '../core';
import type { ErrorContext } from '../error-handling';
import { buildQueryParams } from '../helpers';
import {
    WorkflowCardAttributes,
    WorkflowCardNoteAttributes,
    WorkflowCardNoteResource,
    WorkflowCardNoteSingle,
    WorkflowCardNotesList,
    WorkflowCardResource,
    WorkflowCardSingle,
    WorkflowCardsList,
    WorkflowResource,
    WorkflowSingle,
    WorkflowsList,
} from '../types';

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
