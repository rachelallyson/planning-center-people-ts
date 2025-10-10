/**
 * v2.0.0 Person Match Scoring
 */

import type { PersonResource } from '../types';
import type { PersonMatchOptions } from '../modules/people';

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
            totalScore += emailScore * 0.4;
            maxScore += 0.4;
        }

        // Phone matching (high weight)
        if (options.phone) {
            const phoneScore = this.scorePhoneMatch(person, options.phone);
            totalScore += phoneScore * 0.3;
            maxScore += 0.3;
        }

        // Name matching (medium weight)
        if (options.firstName || options.lastName) {
            const nameScore = this.scoreNameMatch(person, options);
            totalScore += nameScore * 0.2;
            maxScore += 0.2;
        }

        // Additional criteria (lower weight)
        const additionalScore = this.scoreAdditionalCriteria(person, options);
        totalScore += additionalScore * 0.1;
        maxScore += 0.1;

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
            } else if (nameScore > 0.6) {
                reasons.push('similar name match');
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
        // This would need to check the person's emails
        // For now, return a placeholder score
        // In a real implementation, you'd fetch the person's emails and compare
        return 0;
    }

    /**
     * Score phone matching
     */
    private scorePhoneMatch(person: PersonResource, phone: string): number {
        // This would need to check the person's phone numbers
        // For now, return a placeholder score
        // In a real implementation, you'd fetch the person's phone numbers and compare
        return 0;
    }

    /**
     * Score name matching
     */
    private scoreNameMatch(person: PersonResource, options: PersonMatchOptions): number {
        const attrs = person.attributes;
        if (!attrs) return 0;

        let score = 0;

        // First name matching
        if (options.firstName && attrs.first_name) {
            const firstNameScore = this.calculateStringSimilarity(
                options.firstName.toLowerCase(),
                attrs.first_name.toLowerCase()
            );
            score += firstNameScore * 0.5;
        }

        // Last name matching
        if (options.lastName && attrs.last_name) {
            const lastNameScore = this.calculateStringSimilarity(
                options.lastName.toLowerCase(),
                attrs.last_name.toLowerCase()
            );
            score += lastNameScore * 0.5;
        }

        return score;
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
