import { PcoRateLimiter } from '../src/rate-limiter';

describe('PcoRateLimiter', () => {
  let rateLimiter: PcoRateLimiter;

  beforeEach(() => {
    rateLimiter = new PcoRateLimiter(100, 20000); // 100 requests per 20 seconds
  });

  describe('constructor', () => {
    it('should use default values when no parameters provided', () => {
      const defaultLimiter = new PcoRateLimiter();
      const info = defaultLimiter.getRateLimitInfo();
      
      expect(info.limit).toBe(100);
      expect(info.remaining).toBe(100);
    });

    it('should use custom values when provided', () => {
      const customLimiter = new PcoRateLimiter(50, 10000);
      const info = customLimiter.getRateLimitInfo();
      
      expect(info.limit).toBe(50);
      expect(info.remaining).toBe(50);
    });
  });

  describe('canMakeRequest', () => {
    it('should return true when under limit', () => {
      expect(rateLimiter.canMakeRequest()).toBe(true);
    });

    it('should return false when at limit', () => {
      // Record 100 requests
      for (let i = 0; i < 100; i++) {
        rateLimiter.recordRequest();
      }
      
      expect(rateLimiter.canMakeRequest()).toBe(false);
    });
  });

  describe('recordRequest', () => {
    it('should increment request count', () => {
      const initialInfo = rateLimiter.getRateLimitInfo();
      rateLimiter.recordRequest();
      const newInfo = rateLimiter.getRateLimitInfo();
      
      expect(newInfo.remaining).toBe(initialInfo.remaining - 1);
    });

    it('should not exceed limit', () => {
      // Record 100 requests
      for (let i = 0; i < 100; i++) {
        rateLimiter.recordRequest();
      }
      
      const info = rateLimiter.getRateLimitInfo();
      expect(info.remaining).toBe(0);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return correct initial info', () => {
      const info = rateLimiter.getRateLimitInfo();
      
      expect(info.limit).toBe(100);
      expect(info.remaining).toBe(100);
      expect(info.resetTime).toBeGreaterThan(Date.now());
    });

    it('should update remaining after recording requests', () => {
      rateLimiter.recordRequest();
      rateLimiter.recordRequest();
      
      const info = rateLimiter.getRateLimitInfo();
      expect(info.remaining).toBe(98);
    });
  });

  describe('updateFromHeaders', () => {
    it('should update limit from headers', () => {
      const headers = {
        'X-PCO-API-Request-Rate-Limit': '200',
        'X-PCO-API-Request-Rate-Count': '50',
      };
      
      rateLimiter.updateFromHeaders(headers);
      const info = rateLimiter.getRateLimitInfo();
      
      expect(info.limit).toBe(200);
      expect(info.remaining).toBe(150); // 200 - 50
    });

    it('should handle retry-after header', () => {
      const headers = {
        'Retry-After': '30',
      };
      
      const beforeUpdate = rateLimiter.getRateLimitInfo();
      rateLimiter.updateFromHeaders(headers);
      const afterUpdate = rateLimiter.getRateLimitInfo();
      
      // Reset time should be updated
      expect(afterUpdate.resetTime).toBeGreaterThan(beforeUpdate.resetTime);
    });

    it('should handle partial headers', () => {
      const headers = {
        'X-PCO-API-Request-Rate-Limit': '150',
      };
      
      rateLimiter.updateFromHeaders(headers);
      const info = rateLimiter.getRateLimitInfo();
      
      expect(info.limit).toBe(150);
      // Count should remain unchanged if not provided, so remaining = 150 - 0 = 150
      expect(info.remaining).toBe(150);
    });

    it('should update window period from headers', () => {
      const headers = {
        'X-PCO-API-Request-Rate-Period': '30', // 30 seconds
      };
      
      const beforeUpdate = rateLimiter.getDebugInfo();
      rateLimiter.updateFromHeaders(headers);
      const afterUpdate = rateLimiter.getDebugInfo();
      
      expect(afterUpdate.windowMs).toBe(30000); // 30 seconds in milliseconds
    });
  });

  describe('waitForAvailability', () => {
    it('should resolve immediately when under limit', async () => {
      const start = Date.now();
      await rateLimiter.waitForAvailability();
      const end = Date.now();
      
      expect(end - start).toBeLessThan(100); // Should be very fast
    });

    it('should wait when at limit', async () => {
      // Create a limiter with a very short window for testing
      const shortLimiter = new PcoRateLimiter(10, 100); // 10 requests per 100ms
      
      // Record 10 requests to hit limit
      for (let i = 0; i < 10; i++) {
        shortLimiter.recordRequest();
      }
      
      const start = Date.now();
      await shortLimiter.waitForAvailability();
      const end = Date.now();
      
      // Should have waited for the window to reset (at least 100ms)
      expect(end - start).toBeGreaterThanOrEqual(100);
    }, 15000);
  });

  describe('getTimeUntilReset', () => {
    it('should return positive value initially', () => {
      const timeUntilReset = rateLimiter.getTimeUntilReset();
      expect(timeUntilReset).toBeGreaterThan(0);
    });

    it('should reset window after expiration', () => {
      // Create a limiter with a very short window
      const shortLimiter = new PcoRateLimiter(100, 100); // 100ms window
      
      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // After window expires, updateWindow() resets the window
          // so getTimeUntilReset() returns the full window duration (100ms)
          const timeUntilReset = shortLimiter.getTimeUntilReset();
          expect(timeUntilReset).toBeGreaterThan(95); // Allow for timing precision
          
          // And the request count should be reset to 0
          const info = shortLimiter.getRateLimitInfo();
          expect(info.remaining).toBe(100);
          resolve();
        }, 150);
      });
    }, 15000);
  });

  describe('getDebugInfo', () => {
    it('should return debug information', () => {
      const debugInfo = rateLimiter.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('canMakeRequest');
      expect(debugInfo).toHaveProperty('limit');
      expect(debugInfo).toHaveProperty('requestCount');
      expect(debugInfo).toHaveProperty('timeUntilReset');
      expect(debugInfo).toHaveProperty('windowMs');
      expect(debugInfo).toHaveProperty('windowStart');
    });

    it('should reflect current state', () => {
      rateLimiter.recordRequest();
      const debugInfo = rateLimiter.getDebugInfo();
      
      expect(debugInfo.requestCount).toBe(1);
      expect(debugInfo.canMakeRequest).toBe(true);
    });
  });

  describe('window management', () => {
    it('should reset window when time expires', () => {
      // Create a limiter with a very short window
      const shortLimiter = new PcoRateLimiter(10, 100); // 10 requests per 100ms
      
      // Record 10 requests
      for (let i = 0; i < 10; i++) {
        shortLimiter.recordRequest();
      }
      
      expect(shortLimiter.canMakeRequest()).toBe(false);
      
      // Wait for window to reset
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(shortLimiter.canMakeRequest()).toBe(true);
          const info = shortLimiter.getRateLimitInfo();
          expect(info.remaining).toBe(10);
          resolve();
        }, 150);
      });
    });
  });

  describe('parseRateLimitError', () => {
    it('should parse rate limit error details', () => {
      const errorDetail = 'Rate limit exceeded: 118 of 100 requests per 20 seconds';
      const parsed = PcoRateLimiter.parseRateLimitError(errorDetail);
      
      expect(parsed).toEqual({
        current: 118,
        limit: 100,
        period: 20
      });
    });

    it('should return null for invalid error format', () => {
      const errorDetail = 'Some other error message';
      const parsed = PcoRateLimiter.parseRateLimitError(errorDetail);
      
      expect(parsed).toBeNull();
    });

    it('should handle different period values', () => {
      const errorDetail = 'Rate limit exceeded: 50 of 75 requests per 30 seconds';
      const parsed = PcoRateLimiter.parseRateLimitError(errorDetail);
      
      expect(parsed).toEqual({
        current: 50,
        limit: 75,
        period: 30
      });
    });
  });
});
