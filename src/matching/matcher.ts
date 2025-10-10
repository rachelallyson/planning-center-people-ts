/**
 * v2.0.0 Person Matching Logic
 */

import type { PeopleModule } from '../modules/people';
import type { PersonResource } from '../types';
import { PersonMatchOptions } from '../modules/people';
import { MatchStrategies } from './strategies';
import { MatchScorer } from './scoring';

export interface MatchResult {
    person: PersonResource;
    score: number;
    reason: string;
}

export class PersonMatcher {
    private strategies: MatchStrategies;
    private scorer: MatchScorer;

    constructor(private peopleModule: PeopleModule) {
        this.strategies = new MatchStrategies();
        this.scorer = new MatchScorer();
    }

    /**
     * Find or create a person with smart matching
     */
    async findOrCreate(options: PersonMatchOptions): Promise<PersonResource> {
        const { createIfNotFound = true, matchStrategy = 'fuzzy', ...searchOptions } = options;

        // Try to find existing person
        const match = await this.findMatch({ ...searchOptions, matchStrategy });

        if (match) {
            return match.person;
        }

        // Create new person if not found and creation is enabled
        if (createIfNotFound) {
            return this.createPerson(options);
        }

        throw new Error(`No matching person found and creation is disabled`);
    }

    /**
     * Find the best match for a person
     */
    async findMatch(options: PersonMatchOptions): Promise<MatchResult | null> {
        const { matchStrategy = 'fuzzy' } = options;

        // Get all potential matches
        const candidates = await this.getCandidates(options);

        if (candidates.length === 0) {
            return null;
        }

        // Score and rank candidates
        const scoredCandidates = candidates.map(candidate => ({
            person: candidate,
            score: this.scorer.scoreMatch(candidate, options),
            reason: this.scorer.getMatchReason(candidate, options),
        }));

        // Sort by score (highest first)
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Apply strategy-specific filtering
        const bestMatch = this.strategies.selectBestMatch(scoredCandidates, matchStrategy);

        return bestMatch;
    }

    /**
     * Get potential matching candidates
     */
    private async getCandidates(options: PersonMatchOptions): Promise<PersonResource[]> {
        const candidates: PersonResource[] = [];
        const { email, phone, firstName, lastName } = options;

        // Strategy 1: Exact email match
        if (email) {
            try {
                const emailMatches = await this.peopleModule.search({ email });
                candidates.push(...emailMatches.data);
            } catch (error) {
                // Email search failed, continue with other strategies
            }
        }

        // Strategy 2: Exact phone match
        if (phone) {
            try {
                const phoneMatches = await this.peopleModule.search({ phone });
                candidates.push(...phoneMatches.data);
            } catch (error) {
                // Phone search failed, continue with other strategies
            }
        }

        // Strategy 3: Name-based search
        if (firstName && lastName) {
            try {
                const nameMatches = await this.peopleModule.search({
                    name: `${firstName} ${lastName}`
                });
                candidates.push(...nameMatches.data);
            } catch (error) {
                // Name search failed, continue with other strategies
            }
        }

        // Strategy 4: Broader search if no exact matches
        if (candidates.length === 0 && (firstName || lastName)) {
            try {
                const broadMatches = await this.peopleModule.search({
                    name: firstName || lastName || '',
                });
                candidates.push(...broadMatches.data);
            } catch (error) {
                // Broad search failed
            }
        }

        // Remove duplicates based on person ID
        const uniqueCandidates = candidates.filter((person, index, self) =>
            index === self.findIndex(p => p.id === person.id)
        );

        return uniqueCandidates;
    }

    /**
     * Create a new person
     */
    private async createPerson(options: PersonMatchOptions): Promise<PersonResource> {
        const personData: any = {};

        if (options.firstName) personData.first_name = options.firstName;
        if (options.lastName) personData.last_name = options.lastName;
        if (options.email) personData.email = options.email;
        if (options.phone) personData.phone = options.phone;

        const person = await this.peopleModule.create(personData);

        // Add contact information if provided
        const contacts: any = {};

        if (options.email) {
            contacts.email = { address: options.email, primary: true };
        }

        if (options.phone) {
            contacts.phone = { number: options.phone, primary: true };
        }

        if (Object.keys(contacts).length > 0) {
            await this.peopleModule.createWithContacts(personData, contacts);
        }

        return person;
    }

    /**
     * Get all potential matches with detailed scoring
     */
    async getAllMatches(options: PersonMatchOptions): Promise<MatchResult[]> {
        const candidates = await this.getCandidates(options);

        return candidates.map(candidate => ({
            person: candidate,
            score: this.scorer.scoreMatch(candidate, options),
            reason: this.scorer.getMatchReason(candidate, options),
        })).sort((a, b) => b.score - a.score);
    }

    /**
     * Check if a person matches the given criteria
     */
    async isMatch(personId: string, options: PersonMatchOptions): Promise<MatchResult | null> {
        const person = await this.peopleModule.getById(personId);
        const score = this.scorer.scoreMatch(person, options);

        if (score > 0.5) { // Threshold for considering it a match
            return {
                person,
                score,
                reason: this.scorer.getMatchReason(person, options),
            };
        }

        return null;
    }
}
