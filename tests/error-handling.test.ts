import { 
  PcoError, 
  ErrorCategory, 
  ErrorSeverity,
  retryWithBackoff,
  withErrorBoundary,
  shouldNotRetry,
  handleNetworkError,
  handleTimeoutError,
  handleValidationError
} from '../src/error-handling';
import { PcoApiError } from '../src/api-error';

describe('PcoError', () => {
  describe('constructor', () => {
    it('should create error with correct properties', () => {
      const error = new PcoError(
        'Test error',
        400,
        'Bad Request',
        [],
        undefined,
        { endpoint: '/test' }
      );

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.statusText).toBe('Bad Request');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.retryable).toBe(false);
      expect(error.context.endpoint).toBe('/test');
    });

    it('should categorize authentication errors correctly', () => {
      const error = new PcoError('Unauthorized', 401, 'Unauthorized', []);
      
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(false);
    });

    it('should categorize authorization errors correctly', () => {
      const error = new PcoError('Forbidden', 403, 'Forbidden', []);
      
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(false);
    });

    it('should categorize rate limit errors correctly', () => {
      const error = new PcoError('Rate limited', 429, 'Too Many Requests', []);
      
      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
    });

    it('should categorize validation errors correctly', () => {
      const error = new PcoError('Validation failed', 422, 'Unprocessable Entity', []);
      
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.retryable).toBe(false);
    });

    it('should categorize server errors correctly', () => {
      const error = new PcoError('Server error', 500, 'Internal Server Error', []);
      
      expect(error.category).toBe(ErrorCategory.EXTERNAL_API);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    it('should categorize network errors correctly', () => {
      const error = new PcoError('Network error', 0, 'Network Error', []);
      
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
    });
  });

  describe('fromFetchError', () => {
    it('should create error from fetch response', () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as Response;

      const error = PcoError.fromFetchError(mockResponse, {
        errors: [{ detail: 'Test error detail' }]
      });

      expect(error.status).toBe(400);
      expect(error.statusText).toBe('Bad Request');
      expect(error.errors).toEqual([{ detail: 'Test error detail' }]);
    });

    it('should handle missing errors array', () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as Response;

      const error = PcoError.fromFetchError(mockResponse);

      expect(error.status).toBe(500);
      expect(error.errors).toEqual([]);
    });
  });

  describe('getRetryDelay', () => {
    it('should return retry delay from headers', () => {
      const error = new PcoError(
        'Rate limited',
        429,
        'Too Many Requests',
        [],
        { 'Retry-After': '30' }
      );

      expect(error.getRetryDelay()).toBe(30000); // 30 seconds in milliseconds
    });

    it('should return 0 when no retry-after header', () => {
      const error = new PcoError('Error', 500, 'Server Error', []);

      expect(error.getRetryDelay()).toBe(0);
    });

    it('should handle invalid retry-after header', () => {
      const error = new PcoError(
        'Rate limited',
        429,
        'Too Many Requests',
        [],
        { 'Retry-After': 'invalid' }
      );

      expect(error.getRetryDelay()).toBe(60000); // Default fallback
    });
  });

  describe('shouldRetry', () => {
    it('should return true for retryable errors', () => {
      const error = new PcoError('Server error', 500, 'Internal Server Error', []);
      expect(error.shouldRetry()).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = new PcoError('Bad request', 400, 'Bad Request', []);
      expect(error.shouldRetry()).toBe(false);
    });
  });

  describe('getErrorSummary', () => {
    it('should return complete error summary', () => {
      const error = new PcoError(
        'Test error',
        400,
        'Bad Request',
        [{ detail: 'Test detail' }],
        undefined,
        { endpoint: '/test' }
      );

      const summary = error.getErrorSummary();

      expect(summary).toHaveProperty('category');
      expect(summary).toHaveProperty('context');
      expect(summary).toHaveProperty('errors');
      expect(summary).toHaveProperty('message');
      expect(summary).toHaveProperty('name');
      expect(summary).toHaveProperty('retryable');
      expect(summary).toHaveProperty('severity');
      expect(summary).toHaveProperty('status');
      expect(summary).toHaveProperty('statusText');
    });
  });
});

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await retryWithBackoff(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new PcoError('Server error', 500, 'Internal Server Error', []))
      .mockResolvedValue('success');
    
    const result = await retryWithBackoff(mockFn, { maxRetries: 2, baseDelay: 10 });
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable errors', async () => {
    const mockFn = jest.fn().mockRejectedValue(new PcoError('Bad request', 400, 'Bad Request', []));
    
    await expect(retryWithBackoff(mockFn)).rejects.toThrow(PcoError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const onRetry = jest.fn();
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new PcoError('Server error', 500, 'Internal Server Error', []))
      .mockResolvedValue('success');
    
    await retryWithBackoff(mockFn, { onRetry, baseDelay: 10 });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should respect maxRetries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new PcoError('Server error', 500, 'Internal Server Error', []));
    
    await expect(retryWithBackoff(mockFn, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow(PcoError);
    expect(mockFn).toHaveBeenCalledTimes(2); // Initial + 1 retry (maxRetries: 2 means 2 total attempts)
  });

  it('should use retry-after header for rate limit errors', async () => {
    const rateLimitError = new PcoError(
      'Rate limited',
      429,
      'Too Many Requests',
      [],
      { 'Retry-After': '1' }
    );
    
    const mockFn = jest.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue('success');
    
    const start = Date.now();
    const result = await retryWithBackoff(mockFn, { baseDelay: 10 });
    const end = Date.now();
    
    expect(result).toBe('success');
    expect(end - start).toBeGreaterThan(999); // Should wait at least 1 second (allowing for timing precision)
  });
});

describe('withErrorBoundary', () => {
  it('should return result on success', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await withErrorBoundary(mockFn, { endpoint: '/test' });
    
    expect(result).toBe('success');
  });

  it('should wrap unknown errors', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Unknown error'));
    
    await expect(withErrorBoundary(mockFn, { endpoint: '/test' })).rejects.toThrow(PcoError);
  });

  it('should preserve PcoError instances', async () => {
    const pcoError = new PcoError('PCO error', 400, 'Bad Request', []);
    const mockFn = jest.fn().mockRejectedValue(pcoError);
    
    await expect(withErrorBoundary(mockFn)).rejects.toThrow(pcoError);
  });
});

describe('shouldNotRetry', () => {
  it('should return true for non-retryable PcoError', () => {
    const error = new PcoError('Bad request', 400, 'Bad Request', []);
    expect(shouldNotRetry(error)).toBe(true);
  });

  it('should return false for retryable PcoError', () => {
    const error = new PcoError('Server error', 500, 'Internal Server Error', []);
    expect(shouldNotRetry(error)).toBe(false);
  });

  it('should return true for non-retryable PcoApiError', () => {
    const error = new PcoApiError('Bad request', 400, 'Bad Request', []);
    expect(shouldNotRetry(error)).toBe(true);
  });

  it('should return false for other errors', () => {
    const error = new Error('Unknown error');
    expect(shouldNotRetry(error)).toBe(false);
  });
});

describe('Error handlers', () => {
  describe('handleNetworkError', () => {
    it('should create network error', () => {
      const originalError = new Error('Connection failed');
      
      expect(() => {
        handleNetworkError(originalError, 'GET /test');
      }).toThrow(PcoError);
    });
  });

  describe('handleTimeoutError', () => {
    it('should create timeout error', () => {
      expect(() => {
        handleTimeoutError('GET /test', 30000);
      }).toThrow(PcoError);
    });
  });

  describe('handleValidationError', () => {
    it('should create validation error', () => {
      expect(() => {
        handleValidationError(new Error('Invalid data'), 'email');
      }).toThrow(PcoError);
    });
  });
});
