/**
 * v2.0.0 Workflows Module
 */

import { BaseModule } from './base';
import type { PcoHttpClient } from '../core/http';
import type { PaginationHelper } from '../core/pagination';
import type { PcoEventEmitter } from '../monitoring';
import type { PaginationOptions, PaginationResult } from '../core/pagination';
import type {
    WorkflowResource,
    WorkflowAttributes,
    WorkflowCardResource,
    WorkflowCardAttributes,
    WorkflowCardAssignableAttributes,
    WorkflowCardSnoozeAttributes,
    WorkflowCardEmailAttributes,
    WorkflowCardNoteResource,
    WorkflowCardNoteAttributes
} from '../types';

export interface WorkflowListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export interface AddPersonToWorkflowOptions {
    note?: string;
    skipIfExists?: boolean;
    skipIfActive?: boolean;
    noteTemplate?: string;
}

export class WorkflowsModule extends BaseModule {
    /**
     * Get all workflows
     */
    async getAll(options: WorkflowListOptions = {}): Promise<{ data: WorkflowResource[]; meta?: any; links?: any }> {
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

        return this.getList<WorkflowResource>('/workflows', params);
    }

    /**
     * Get all workflows across all pages
     */
    async getAllPagesPaginated(options: WorkflowListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<WorkflowResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<WorkflowResource>('/workflows', params, paginationOptions);
    }

    /**
     * Get a single workflow by ID
     */
    async getById(id: string, include?: string[]): Promise<WorkflowResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<WorkflowResource>(`/workflows/${id}`, params);
    }

    /**
     * Create a workflow
     */
    async create(data: WorkflowAttributes): Promise<WorkflowResource> {
        return this.createResource<WorkflowResource>('/workflows', data);
    }

    /**
     * Update a workflow
     */
    async update(id: string, data: Partial<WorkflowAttributes>): Promise<WorkflowResource> {
        return this.updateResource<WorkflowResource>(`/workflows/${id}`, data);
    }

    /**
     * Delete a workflow
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/workflows/${id}`);
    }

    /**
     * Get workflow cards for a person
     */
    async getPersonWorkflowCards(personId: string): Promise<{ data: WorkflowCardResource[]; meta?: any; links?: any }> {
        return this.getList<WorkflowCardResource>(`/people/${personId}/workflow_cards`);
    }

    /**
     * Add a person to a workflow with smart duplicate detection
     */
    async addPersonToWorkflow(
        personId: string,
        workflowId: string,
        options: AddPersonToWorkflowOptions = {}
    ): Promise<WorkflowCardResource> {
        const { skipIfExists = true, skipIfActive = true } = options;

        // Check for existing workflow cards if requested
        if (skipIfExists || skipIfActive) {
            const existingCards = await this.getPersonWorkflowCards(personId);
            const existingCard = existingCards.data.find(card => {
                const workflowData = card.relationships?.workflow?.data;
                return workflowData && !Array.isArray(workflowData) && workflowData.id === workflowId;
            });

            if (existingCard && existingCard.attributes) {
                // Check if card is completed or removed
                if (skipIfExists && (existingCard.attributes.completed_at || existingCard.attributes.removed_at)) {
                    throw new Error(`Person already has a completed/removed card in this workflow`);
                }

                // Check if card is active
                if (skipIfActive && !existingCard.attributes.completed_at && !existingCard.attributes.removed_at) {
                    throw new Error(`Person already has an active card in this workflow`);
                }
            }
        }

        // Create the workflow card
        const workflowCard = await this.createResource<WorkflowCardResource>(`/workflows/${workflowId}/cards`, {
            person_id: personId,
        } as Partial<WorkflowCardAttributes>);

        // Add note if provided
        if (options.note || options.noteTemplate) {
            const noteText = options.note || this.formatNoteTemplate(options.noteTemplate!, { personId, workflowId });
            await this.createWorkflowCardNote(personId, workflowCard.id, { note: noteText });
        }

        return workflowCard;
    }

    /**
     * Create a workflow card
     */
    async createWorkflowCard(workflowId: string, personId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/workflows/${workflowId}/cards`, {
            person_id: personId,
        } as Partial<WorkflowCardAttributes>);
    }

    /**
     * Update a workflow card
     */
    async updateWorkflowCard(workflowCardId: string, data: Partial<WorkflowCardAssignableAttributes>, personId?: string): Promise<WorkflowCardResource> {
        // If personId is provided, use the person-specific endpoint
        if (personId) {
            return this.updateResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}`, data);
        }
        // Fallback to the generic endpoint (may not work for all operations)
        return this.updateResource<WorkflowCardResource>(`/workflow_cards/${workflowCardId}`, data);
    }

    /**
     * Get workflow card notes
     */
    async getWorkflowCardNotes(personId: string, workflowCardId: string): Promise<{ data: WorkflowCardNoteResource[]; meta?: any; links?: any }> {
        return this.getList<WorkflowCardNoteResource>(`/people/${personId}/workflow_cards/${workflowCardId}/notes`);
    }

    /**
     * Create a workflow card note
     */
    async createWorkflowCardNote(
        personId: string,
        workflowCardId: string,
        data: WorkflowCardNoteAttributes
    ): Promise<WorkflowCardNoteResource> {
        return this.createResource<WorkflowCardNoteResource>(`/people/${personId}/workflow_cards/${workflowCardId}/notes`, data);
    }

    /**
     * Update a workflow card note
     */
    async updateWorkflowCardNote(
        personId: string,
        workflowCardId: string,
        noteId: string,
        data: Partial<WorkflowCardNoteAttributes>
    ): Promise<WorkflowCardNoteResource> {
        return this.updateResource<WorkflowCardNoteResource>(`/people/${personId}/workflow_cards/${workflowCardId}/notes/${noteId}`, data);
    }

    /**
     * Delete a workflow card note
     */
    async deleteWorkflowCardNote(personId: string, workflowCardId: string, noteId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/workflow_cards/${workflowCardId}/notes/${noteId}`);
    }

    /**
     * Create a workflow card with a note
     */
    async createWorkflowCardWithNote(
        workflowId: string,
        personId: string,
        noteData: WorkflowCardNoteAttributes
    ): Promise<{
        workflowCard: WorkflowCardResource;
        note: WorkflowCardNoteResource;
    }> {
        const workflowCard = await this.createWorkflowCard(workflowId, personId);
        const note = await this.createWorkflowCardNote(personId, workflowCard.id, noteData);

        return { workflowCard, note };
    }

    /**
     * Move a workflow card back to the previous step
     */
    async goBackWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/go_back`, {});
    }

    /**
     * Move a workflow card to the next step
     */
    async promoteWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/promote`, {});
    }

    /**
     * Remove a workflow card
     */
    async removeWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/remove`, {});
    }

    /**
     * Restore a workflow card
     */
    async restoreWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/restore`, {});
    }

    /**
     * Send an email to the subject of the workflow card
     */
    async sendEmailWorkflowCard(
        personId: string,
        workflowCardId: string,
        data: WorkflowCardEmailAttributes
    ): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/send_email`, data);
    }

    /**
     * Move a workflow card to the next step without completing the current step
     */
    async skipStepWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/skip_step`, {});
    }

    /**
     * Snooze a workflow card for a specific duration
     */
    async snoozeWorkflowCard(personId: string, workflowCardId: string, data: WorkflowCardSnoozeAttributes): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/snooze`, data);
    }

    /**
     * Unsnooze a workflow card
     */
    async unsnoozeWorkflowCard(personId: string, workflowCardId: string): Promise<WorkflowCardResource> {
        return this.createResource<WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/unsnooze`, {});
    }

    /**
     * Format note template with variables
     */
    private formatNoteTemplate(template: string, variables: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] || match;
        });
    }
}
