/**
 * v2.0.0 Person Match Scoring
 */

import type { PersonResource } from '../types';
import type { PersonMatchOptions } from '../modules/people';
import { matchesAgeCriteria, calculateAgeSafe } from '../helpers';

export class MatchScorer {
    /**
     * Score a person match based on various criteria
     */
    scoreMatch(person: PersonResource, options: PersonMatchOptions): number {
        let totalScore = 0;
        let maxScore = 0;

        // Email matching (highest weight)
        if (options.email) {
            const emailScore = this.scoreEmailMatch(person, options.email);
            totalScore += emailScore * 0.35;
            maxScore += 0.35;
        }

        // Phone matching (high weight)
        if (options.phone) {
            const phoneScore = this.scorePhoneMatch(person, options.phone);
            totalScore += phoneScore * 0.25;
            maxScore += 0.25;
        }

        // Name matching (increased weight for name-only matches)
        if (options.firstName || options.lastName) {
            const nameScore = this.scoreNameMatch(person, options);
            // Increase weight to 0.4 for name-only matches, 0.2 when combined with other criteria
            const nameWeight = (!options.email && !options.phone) ? 0.4 : 0.2;
            totalScore += nameScore * nameWeight;
            maxScore += nameWeight;
        }

        // Age matching (medium weight)
        const ageScore = this.scoreAgeMatch(person, options);
        totalScore += ageScore * 0.15;
        maxScore += 0.15;

        // Additional criteria (lower weight)
        const additionalScore = this.scoreAdditionalCriteria(person, options);
        totalScore += additionalScore * 0.05;
        maxScore += 0.05;

        return maxScore > 0 ? totalScore / maxScore : 0;
    }

    /**
     * Get a human-readable reason for the match
     */
    getMatchReason(person: PersonResource, options: PersonMatchOptions): string {
        const reasons: string[] = [];

        if (options.email && this.scoreEmailMatch(person, options.email) > 0.8) {
            reasons.push('exact email match');
        }

        if (options.phone && this.scorePhoneMatch(person, options.phone) > 0.8) {
            reasons.push('exact phone match');
        }

        if (options.firstName || options.lastName) {
            const nameScore = this.scoreNameMatch(person, options);
            if (nameScore > 0.8) {
                reasons.push('exact name match');
            } else if (nameScore > 0) {
                reasons.push('partial name match');
            }
        }

        // Add age-based match reasons
        const ageScore = this.scoreAgeMatch(person, options);
        if (ageScore > 0.8) {
            const age = calculateAgeSafe(person.attributes?.birthdate);
            if (age !== null) {
                if (options.agePreference === 'adults') {
                    reasons.push('adult age match');
                } else if (options.agePreference === 'children') {
                    reasons.push('child age match');
                } else {
                    reasons.push(`age ${age} match`);
                }
            }
        }

        if (reasons.length === 0) {
            return 'partial match';
        }

        return reasons.join(', ');
    }

    /**
     * Score email matching
     */
    private scoreEmailMatch(person: PersonResource, email: string): number {
        // Check if the person has the email in their relationships or attributes
        // For now, we'll assume if the search found this person by email, it's a match
        // In a more sophisticated implementation, we'd fetch and compare actual emails
        return 1.0; // Perfect match since search found this person by email
    }

    /**
     * Score phone matching
     */
    private scorePhoneMatch(person: PersonResource, phone: string): number {
        // Check if the person has the phone in their relationships or attributes
        // For now, we'll assume if the search found this person by phone, it's a match
        // In a more sophisticated implementation, we'd fetch and compare actual phones
        return 1.0; // Perfect match since search found this person by phone
    }

    /**
     * Score name matching - only exact matches
     */
    private scoreNameMatch(person: PersonResource, options: PersonMatchOptions): number {
        const attrs = person.attributes;
        if (!attrs) return 0;

        let score = 0;

        // First name matching - exact match only
        if (options.firstName && attrs.first_name) {
            const firstNameMatch = options.firstName.toLowerCase() === attrs.first_name.toLowerCase();
            score += firstNameMatch ? 0.5 : 0;
        }

        // Last name matching - exact match only
        if (options.lastName && attrs.last_name) {
            const lastNameMatch = options.lastName.toLowerCase() === attrs.last_name.toLowerCase();
            score += lastNameMatch ? 0.5 : 0;
        }

        return score;
    }

    /**
     * Score age matching
     */
    private scoreAgeMatch(person: PersonResource, options: PersonMatchOptions): number {
        const birthdate = person.attributes?.birthdate;

        // If no age criteria specified, return neutral score
        if (!options.agePreference &&
            options.minAge === undefined &&
            options.maxAge === undefined &&
            options.birthYear === undefined) {
            return 0.5; // Neutral score
        }

        // If no birthdate available, return low score
        if (!birthdate) {
            return 0.1;
        }

        // Check if person matches age criteria
        const matches = matchesAgeCriteria(birthdate, {
            agePreference: options.agePreference,
            minAge: options.minAge,
            maxAge: options.maxAge,
            birthYear: options.birthYear
        });

        if (!matches) {
            return 0; // No match
        }

        // Calculate bonus score based on how well the age matches
        const age = calculateAgeSafe(birthdate);
        if (age === null) return 0.5;

        let bonusScore = 0;

        // Bonus for exact age range match
        if (options.minAge !== undefined && options.maxAge !== undefined) {
            if (age >= options.minAge && age <= options.maxAge) {
                bonusScore += 0.3;
            }
        }

        // Bonus for exact birth year match
        if (options.birthYear !== undefined) {
            const birthYear = new Date(birthdate).getFullYear();
            if (birthYear === options.birthYear) {
                bonusScore += 0.4;
            }
        }

        // Base score for matching criteria
        return Math.min(0.6 + bonusScore, 1.0);
    }

    /**
     * Score additional criteria
     */
    private scoreAdditionalCriteria(person: PersonResource, options: PersonMatchOptions): number {
        // Add scoring for other criteria like campus, status, etc.
        return 0;
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity(str1: string, str2: string): number {
        if (str1 === str2) return 1;
        if (str1.length === 0 || str2.length === 0) return 0;

        const matrix: number[][] = [];
        const len1 = str1.length;
        const len2 = str2.length;

        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        return 1 - distance / maxLength;
    }
}
