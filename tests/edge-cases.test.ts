/**
 * Edge Case Validation Tests
 * 
 * These tests validate the package's behavior under edge cases and unusual conditions
 * to ensure robust error handling and type safety.
 */

import {
  createPcoClient,
  getPeople,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  getPersonEmails,
  createPersonEmail,
  getPersonPhoneNumbers,
  createPersonPhoneNumber,
  getLists,
  getNotes,
  getWorkflows,
  getOrganization,
  type PcoClientState,
} from '../src';

// Mock fetch for edge case testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Edge Case Validation', () => {
  let client: PcoClientState;

  beforeEach(() => {
    client = createPcoClient({
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
    });
    mockFetch.mockClear();
  });

  describe('Empty Response Handling', () => {
    it('should handle empty data arrays gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({
          data: [],
          meta: { total_count: 0, count: 0 },
          links: {},
        }),
      });

      const result = await getPeople(client, { per_page: 10 });
      
      expect(result.data).toEqual([]);
      expect(result.meta?.total_count).toBe(0);
      expect(result.meta?.count).toBe(0);
    });

    it('should handle null/undefined attributes gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({
          data: [{
            type: 'Person',
            id: '123',
            attributes: {
              first_name: null,
              last_name: undefined,
              email: '',
              created_at: null,
            },
            relationships: {},
          }],
          meta: { total_count: 1, count: 1 },
        }),
      });

      const result = await getPeople(client, { per_page: 1 });
      
      expect(result.data[0].attributes?.first_name).toBeNull();
      expect(result.data[0].attributes?.last_name).toBeUndefined();
      expect(result.data[0].attributes?.email).toBe('');
    });
  });

  describe('Error Response Handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({
          'content-type': 'text/plain',
        }),
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(getPeople(client)).rejects.toThrow();
    });

    it('should handle network timeouts gracefully', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(getPeople(client)).rejects.toThrow('Network error');
    });

    it('should handle rate limit errors with retry-after headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'retry-after': '60',
          'x-pco-api-request-rate-count': '100',
          'x-pco-api-request-rate-limit': '100',
        }),
        json: async () => ({
          errors: [{
            status: '429',
            title: 'Rate Limit Exceeded',
            detail: 'Too many requests',
          }],
        }),
      });

      await expect(getPeople(client)).rejects.toThrow();
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle expired access tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({
          errors: [{
            status: '401',
            title: 'Unauthorized',
            detail: 'Access token has expired',
          }],
        }),
      });

      await expect(getPeople(client)).rejects.toMatchObject({
        status: 401,
        errors: expect.arrayContaining([
          expect.objectContaining({
            detail: 'Access token has expired',
          }),
        ]),
      });
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [{ type: 'Person', id: '123', attributes: {}, relationships: {} }],
          meta: { total_count: 1, count: 1 },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const promises = [
        getPeople(client),
        getLists(client),
        getNotes(client),
        getWorkflows(client),
        getOrganization(client),
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.data).toBeDefined();
      });
    });
  });
});
