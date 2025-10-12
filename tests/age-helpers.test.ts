/**
 * Age Helper Functions Tests
 */

import {
    calculateAge,
    calculateAgeSafe,
    isAdult,
    isChild,
    matchesAgeCriteria,
    calculateBirthYearFromAge,
} from '../src/helpers';

describe('Age Helper Functions', () => {
    describe('calculateAge', () => {
        it('should calculate age correctly for a person born in 1990', () => {
            const birthdate = '1990-01-01';
            const age = calculateAge(birthdate);
            expect(typeof age).toBe('number');
            expect(age).toBeGreaterThan(30); // Should be around 34-35 years old
        });

        it('should calculate age correctly for a child born in 2010', () => {
            const birthdate = '2010-01-01';
            const age = calculateAge(birthdate);
            expect(typeof age).toBe('number');
            expect(age).toBeGreaterThan(10); // Should be around 14-15 years old
        });

        it('should handle leap year birthdays', () => {
            const birthdate = '2000-02-29'; // Leap year
            const age = calculateAge(birthdate);
            expect(typeof age).toBe('number');
            expect(age).toBeGreaterThan(20); // Should be around 24-25 years old
        });
    });

    describe('calculateAgeSafe', () => {
        it('should return null for undefined birthdate', () => {
            const age = calculateAgeSafe(undefined);
            expect(age).toBeNull();
        });

        it('should return null for invalid birthdate', () => {
            const age = calculateAgeSafe('invalid-date');
            expect(age).toBeNull();
        });

        it('should return age for valid birthdate', () => {
            const age = calculateAgeSafe('1990-01-01');
            expect(age).toBeGreaterThan(30);
        });
    });

    describe('isAdult', () => {
        it('should return true for adults (18+)', () => {
            expect(isAdult('1990-01-01')).toBe(true);
            expect(isAdult('2000-01-01')).toBe(true);
            expect(isAdult('2005-01-01')).toBe(true);
        });

        it('should return false for children (under 18)', () => {
            expect(isAdult('2010-01-01')).toBe(false);
            expect(isAdult('2015-01-01')).toBe(false);
        });

        it('should return false for undefined birthdate', () => {
            expect(isAdult(undefined)).toBe(false);
        });

        it('should return false for invalid birthdate', () => {
            expect(isAdult('invalid-date')).toBe(false);
        });
    });

    describe('isChild', () => {
        it('should return true for children (under 18)', () => {
            expect(isChild('2010-01-01')).toBe(true);
            expect(isChild('2015-01-01')).toBe(true);
        });

        it('should return false for adults (18+)', () => {
            expect(isChild('1990-01-01')).toBe(false);
            expect(isChild('2000-01-01')).toBe(false);
        });

        it('should return false for undefined birthdate', () => {
            expect(isChild(undefined)).toBe(false);
        });

        it('should return false for invalid birthdate', () => {
            expect(isChild('invalid-date')).toBe(false);
        });
    });

    describe('matchesAgeCriteria', () => {
        it('should match adults when agePreference is adults', () => {
            expect(matchesAgeCriteria('1990-01-01', { agePreference: 'adults' })).toBe(true);
            expect(matchesAgeCriteria('2010-01-01', { agePreference: 'adults' })).toBe(false);
        });

        it('should match children when agePreference is children', () => {
            expect(matchesAgeCriteria('2010-01-01', { agePreference: 'children' })).toBe(true);
            expect(matchesAgeCriteria('1990-01-01', { agePreference: 'children' })).toBe(false);
        });

        it('should match any age when agePreference is any', () => {
            expect(matchesAgeCriteria('1990-01-01', { agePreference: 'any' })).toBe(true);
            expect(matchesAgeCriteria('2010-01-01', { agePreference: 'any' })).toBe(true);
        });

        it('should match any age when no agePreference is specified', () => {
            expect(matchesAgeCriteria('1990-01-01', {})).toBe(true);
            expect(matchesAgeCriteria('2010-01-01', {})).toBe(true);
        });

        it('should match age range when minAge and maxAge are specified', () => {
            expect(matchesAgeCriteria('1990-01-01', { minAge: 30, maxAge: 40 })).toBe(true);
            expect(matchesAgeCriteria('2010-01-01', { minAge: 30, maxAge: 40 })).toBe(false);
        });

        it('should match birth year when birthYear is specified', () => {
            expect(matchesAgeCriteria('1990-06-15', { birthYear: 1990 })).toBe(true);
            expect(matchesAgeCriteria('2000-03-20', { birthYear: 1990 })).toBe(false);
        });

        it('should handle undefined birthdate gracefully', () => {
            expect(matchesAgeCriteria(undefined, { agePreference: 'any' })).toBe(true);
            expect(matchesAgeCriteria(undefined, { agePreference: 'adults' })).toBe(false);
            expect(matchesAgeCriteria(undefined, { agePreference: 'children' })).toBe(false);
        });

        it('should combine multiple criteria', () => {
            expect(matchesAgeCriteria('1990-06-15', {
                agePreference: 'adults',
                minAge: 30,
                maxAge: 40,
                birthYear: 1990
            })).toBe(true);

            expect(matchesAgeCriteria('1990-06-15', {
                agePreference: 'adults',
                minAge: 30,
                maxAge: 40,
                birthYear: 2000
            })).toBe(false);
        });
    });

    describe('calculateBirthYearFromAge', () => {
        it('should calculate birth year correctly', () => {
            const currentYear = new Date().getFullYear();
            const age = 30;
            const birthYear = calculateBirthYearFromAge(age);
            expect(birthYear).toBe(currentYear - age);
        });

        it('should handle edge cases', () => {
            const currentYear = new Date().getFullYear();
            expect(calculateBirthYearFromAge(0)).toBe(currentYear);
            expect(calculateBirthYearFromAge(100)).toBe(currentYear - 100);
        });
    });
});
