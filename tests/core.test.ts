import { 
  createPcoClient, 
  getSingle, 
  getList, 
  post, 
  patch, 
  del, 
  getAllPages,
  getRateLimitInfo,
  PcoClientConfig 
} from '../src/core';
import { PcoRateLimiter } from '../src/rate-limiter';
import { PcoError } from '../src/error-handling';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('createPcoClient', () => {
  it('should create client with default configuration', () => {
    const client = createPcoClient({
      accessToken: 'test-token'
    });

    expect(client.config.accessToken).toBe('test-token');
    expect(client.rateLimiter).toBeInstanceOf(PcoRateLimiter);
    expect(client.config.baseURL).toBeUndefined(); // baseURL is only set when explicitly provided
  });

  it('should create client with custom configuration', () => {
    const config: PcoClientConfig = {
      accessToken: 'test-token',
      baseURL: 'https://custom.api.com',
      rateLimit: { maxRequests: 50, perMilliseconds: 30000 },
      timeout: 10000,
      headers: { 'X-Custom': 'value' }
    };

    const client = createPcoClient(config);

    expect(client.config).toEqual(config);
  });

  it('should create client with personal access token', () => {
    const client = createPcoClient({
      personalAccessToken: 'pat-token',
      appId: 'app-id',
      appSecret: 'app-secret'
    });

    expect(client.config.personalAccessToken).toBe('pat-token');
    expect(client.config.appId).toBe('app-id');
    expect(client.config.appSecret).toBe('app-secret');
  });
});

describe('getSingle', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should make GET request for single resource', async () => {
    const mockResponse = {
      data: { id: '1', type: 'Person', attributes: { first_name: 'John' } },
      links: { self: '/people/1' }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse)
    } as unknown as Response);

    const result = await getSingle(client, '/people/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Accept': 'application/json'
        })
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle query parameters', async () => {
    const mockResponse = { data: { id: '1', type: 'Person' } };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse)
    } as unknown as Response);

    await getSingle(client, '/people/1', { include: 'emails', per_page: 10 });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people/1?include=emails&per_page=10',
      expect.any(Object)
    );
  });

  it('should handle absolute URLs', async () => {
    const mockResponse = { data: { id: '1', type: 'Person' } };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse)
    } as unknown as Response);

    await getSingle(client, 'https://api.planningcenteronline.com/people/v2/people/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people/1',
      expect.any(Object)
    );
  });

  it('should throw PcoError on API error', async () => {
    const mockErrorResponse = {
      errors: [{ detail: 'Person not found' }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Map(),
      json: () => Promise.resolve(mockErrorResponse)
    } as unknown as Response);

    await expect(getSingle(client, '/people/999')).rejects.toThrow(PcoError);
  });
});

describe('getList', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should make GET request for list of resources', async () => {
    const mockResponse = {
      data: [
        { id: '1', type: 'Person', attributes: { first_name: 'John' } },
        { id: '2', type: 'Person', attributes: { first_name: 'Jane' } }
      ],
      links: { self: '/people', next: '/people?page=2' }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse)
    } as unknown as Response);

    const result = await getList(client, '/people');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people',
      expect.objectContaining({
        method: 'GET'
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('post', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should make POST request with data', async () => {
    const mockResponse = {
      data: { id: '1', type: 'Person', attributes: { first_name: 'John' } }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse)
    } as unknown as Response);

    const result = await post(client, '/people', { first_name: 'John' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ data: { attributes: { first_name: 'John' } } })
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('patch', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should make PATCH request with data', async () => {
    const mockResponse = {
      data: { id: '1', type: 'Person', attributes: { first_name: 'Jane' } }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse)
    } as unknown as Response);

    const result = await patch(client, '/people/1', { first_name: 'Jane' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ data: { attributes: { first_name: 'Jane' } } })
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('del', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should make DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Map()
    } as unknown as Response);

    await del(client, '/people/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.planningcenteronline.com/people/v2/people/1',
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });
});

describe('getAllPages', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should fetch all pages', async () => {
    const page1Response = {
      data: [{ id: '1', type: 'Person' }],
      links: { next: 'https://api.planningcenteronline.com/people/v2/people?page=2' }
    };

    const page2Response = {
      data: [{ id: '2', type: 'Person' }],
      links: {}
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(page1Response)
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(page2Response)
      } as unknown as Response);

    const result = await getAllPages(client, '/people');

    expect(result).toEqual([
      { id: '1', type: 'Person' },
      { id: '2', type: 'Person' }
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle single page response', async () => {
    const singlePageResponse = {
      data: [{ id: '1', type: 'Person' }],
      links: {}
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(singlePageResponse)
    } as unknown as Response);

    const result = await getAllPages(client, '/people');

    expect(result).toEqual([{ id: '1', type: 'Person' }]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('getRateLimitInfo', () => {
  it('should return rate limit info from client', () => {
    const client = createPcoClient({ accessToken: 'test-token' });
    const info = getRateLimitInfo(client);

    expect(info).toHaveProperty('limit');
    expect(info).toHaveProperty('remaining');
    expect(info).toHaveProperty('resetTime');
  });
});

describe('Authentication', () => {
  it('should use Bearer token for OAuth', async () => {
    const client = createPcoClient({ accessToken: 'oauth-token' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ data: [] })
    } as unknown as Response);

    await getList(client, '/people');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer oauth-token'
        })
      })
    );
  });

  it('should use Basic auth for personal access token', async () => {
    const client = createPcoClient({
      personalAccessToken: 'pat-token',
      appId: 'app-id',
      appSecret: 'app-secret'
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ data: [] })
    } as unknown as Response);

    await getList(client, '/people');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringMatching(/^Basic /)
        })
      })
    );
  });
});

describe('Rate limiting', () => {
  it('should wait for rate limiter before making request', async () => {
    const client = createPcoClient({ accessToken: 'test-token' });
    const waitSpy = jest.spyOn(client.rateLimiter, 'waitForAvailability');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ data: [] })
    } as unknown as Response);

    await getList(client, '/people');

    expect(waitSpy).toHaveBeenCalled();
  });

  it('should update rate limiter from response headers', async () => {
    const client = createPcoClient({ accessToken: 'test-token' });
    const updateSpy = jest.spyOn(client.rateLimiter, 'updateFromHeaders');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([
        ['x-pco-api-request-rate-limit', '100'],
        ['x-pco-api-request-rate-count', '50']
      ]),
      json: () => Promise.resolve({ data: [] })
    } as unknown as Response);

    await getList(client, '/people');

    expect(updateSpy).toHaveBeenCalledWith({
      'X-PCO-API-Request-Rate-Limit': '100',
      'X-PCO-API-Request-Rate-Count': '50',
      'X-PCO-API-Request-Rate-Period': undefined,
      'Retry-After': undefined
    });
  });
});

describe('Error handling', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    mockFetch.mockClear();
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(getList(client, '/people')).rejects.toThrow(PcoError);
  });

  it('should handle timeout errors', async () => {
    const clientWithTimeout = createPcoClient({ 
      accessToken: 'test-token',
      timeout: 1000
    });

    // Mock AbortController
    const mockAbortController = {
      abort: jest.fn(),
      signal: {}
    };
    global.AbortController = jest.fn(() => mockAbortController) as any;

    mockFetch.mockImplementationOnce(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      })
    );

    await expect(getList(clientWithTimeout, '/people')).rejects.toThrow(PcoError);
  });
});
