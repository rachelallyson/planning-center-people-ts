# Best Practices Guide - v2.3.0

This guide covers best practices for production usage, security, performance, and maintainability when using the Planning Center People TypeScript library v2.3.0.

## Table of Contents

1. [Security Best Practices](#security-best-practices)
2. [Production Configuration](#production-configuration)
3. [Error Handling Best Practices](#error-handling-best-practices)
4. [Performance Best Practices](#performance-best-practices)
5. [Code Organization](#code-organization)
6. [Testing Best Practices](#testing-best-practices)
7. [Monitoring & Observability](#monitoring--observability)
8. [Deployment Best Practices](#deployment-best-practices)
9. [Maintenance & Updates](#maintenance--updates)

## Security Best Practices

### Credential Management

#### Environment Variables

**✅ Good:**

```typescript
// Use environment variables for all credentials
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
  }
});
```

**❌ Bad:**

```typescript
// Never hardcode credentials
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'abc123' // ❌ Hardcoded
  }
});
```

#### Secure Environment Configuration

```bash
# .env (never commit to version control)
PCO_PERSONAL_ACCESS_TOKEN=your_token_here
PCO_ACCESS_TOKEN=your_oauth_access_token_here
PCO_REFRESH_TOKEN=your_oauth_refresh_token_here

# Use different values for different environments
PCO_PERSONAL_ACCESS_TOKEN_DEV=dev_token
PCO_PERSONAL_ACCESS_TOKEN_PROD=prod_token
```

#### Token Storage Security

**✅ Good:**

```typescript
// Encrypt tokens in database
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY!;

function encryptToken(token: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptToken(encryptedToken: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Store encrypted tokens
await database.tokens.save({
  userId,
  accessToken: encryptToken(tokens.access_token),
  refreshToken: encryptToken(tokens.refresh_token),
});
```

**❌ Bad:**

```typescript
// Never store tokens in plain text
await database.tokens.save({
  userId,
  accessToken: tokens.access_token, // ❌ Unencrypted
  refreshToken: tokens.refresh_token, // ❌ Unencrypted
});
```

### HTTPS and Transport Security

**✅ Good:**

```typescript
// Force HTTPS in production
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
  },
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.planningcenteronline.com/people/v2'
    : 'http://localhost:3000/api/pco', // Development only
});
```

**❌ Bad:**

```typescript
// Never use HTTP in production
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
  },
  baseURL: 'http://api.planningcenteronline.com/people/v2', // ❌ Insecure
});
```

### Input Validation and Sanitization

**✅ Good:**

```typescript
// Validate and sanitize inputs
function validatePersonData(data: any): Partial<PersonAttributes> {
  const validated: Partial<PersonAttributes> = {};
  
  if (data.first_name && typeof data.first_name === 'string') {
    validated.first_name = data.first_name.trim().substring(0, 100);
  }
  
  if (data.last_name && typeof data.last_name === 'string') {
    validated.last_name = data.last_name.trim().substring(0, 100);
  }
  
  if (data.email && typeof data.email === 'string') {
    const email = data.email.trim().toLowerCase();
    if (isValidEmail(email)) {
      validated.email = email;
    }
  }
  
  return validated;
}

async function createPersonSafely(client: PcoClient, data: any) {
  const validatedData = validatePersonData(data);
  return await client.people.create(validatedData);
}
```

**❌ Bad:**

```typescript
// Never trust user input
async function createPersonUnsafe(client: PcoClient, data: any) {
  return await client.people.create(data); // ❌ No validation
}
```

### Access Control and Permissions

**✅ Good:**

```typescript
// Implement proper access control
class SecurePeopleService {
  constructor(private client: PcoClient, private userPermissions: UserPermissions) {}
  
  async getPerson(personId: string, userId: string): Promise<PersonResource | null> {
    // Check if user has permission to view this person
    if (!this.userPermissions.canViewPerson(userId, personId)) {
      throw new Error('Insufficient permissions');
    }
    
    return await this.client.people.getById(personId);
  }
  
  async updatePerson(personId: string, data: any, userId: string): Promise<PersonResource> {
    // Check if user has permission to update this person
    if (!this.userPermissions.canUpdatePerson(userId, personId)) {
      throw new Error('Insufficient permissions');
    }
    
    // Validate and sanitize data
    const validatedData = validatePersonData(data);
    return await this.client.people.update(personId, validatedData);
  }
}
```

## Production Configuration

### Client Configuration

**✅ Good:**

```typescript
// Production-optimized client configuration
function createProductionClient() {
  return new PcoClient({
    auth: {
      type: 'personal_access_token',
      personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
    },
    
    // Performance optimizations
    timeout: 30000,
    rateLimit: {
      maxRequests: 90, // Leave headroom
      perMilliseconds: 60000
    }
  });
}
```

### Environment-Specific Configuration

```typescript
// Environment-specific configuration
class Config {
  static get clientConfig() {
    const baseConfig = {
      auth: {
        type: 'personal_access_token' as const,
        personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
      }
    };
    
    if (process.env.NODE_ENV === 'production') {
      return {
        ...baseConfig,
        timeout: 30000,
        rateLimit: { maxRequests: 90, perMilliseconds: 60000 }
      };
    } else if (process.env.NODE_ENV === 'development') {
      return {
        ...baseConfig,
        timeout: 60000, // Longer timeout for debugging
        rateLimit: { maxRequests: 50, perMilliseconds: 60000 }
      };
    } else {
      return baseConfig;
    }
  }
}
```

### Health Checks

```typescript
// Production health check
export async function healthCheck(req: Request, res: Response) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      pco: await checkPcoHealth(),
      database: await checkDatabaseHealth(),
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    }
  };
  
  // Determine overall health
  const hasErrors = !health.services.pco.healthy || !health.services.database.healthy;
  
  if (hasErrors) {
    health.status = 'unhealthy';
    res.status(503);
  }
  
  res.json(health);
}

async function checkPcoHealth(): Promise<{ healthy: boolean; latency?: number }> {
  try {
    const client = new PcoClient({
      auth: {
        type: 'personal_access_token',
        personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
      }
    });
    
    const start = Date.now();
    await client.organization.get();
    const latency = Date.now() - start;
    
    return { healthy: true, latency };
  } catch (error) {
    console.error('PCO health check failed:', error);
    return { healthy: false };
  }
}
```

## Error Handling Best Practices

### Comprehensive Error Handling

**✅ Good:**

```typescript
// Comprehensive error handling with logging
class ErrorHandler {
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  async handleApiCall<T>(
    operation: () => Promise<T>,
    context: { operation: string; userId?: string; metadata?: any }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error, context);
      this.handleErrorByType(error, context);
      throw error;
    }
  }
  
  private logError(error: unknown, context: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      operation: context.operation,
      userId: context.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        ...(error instanceof PcoApiError && {
          status: error.status,
          errors: error.errors
        })
      },
      metadata: context.metadata
    };
    
    this.logger.error('API Error', logEntry);
  }
  
  private handleErrorByType(error: unknown, context: any) {
    if (error instanceof PcoApiError) {
      switch (error.status) {
        case 401:
          // Handle authentication errors
          this.handleAuthenticationError(error, context);
          break;
        case 429:
          // Handle rate limiting
          this.handleRateLimitError(error, context);
          break;
        case 422:
          // Handle validation errors
          this.handleValidationError(error, context);
          break;
        default:
          // Handle other errors
          this.handleGenericError(error, context);
      }
    }
  }
  
  private handleAuthenticationError(error: PcoApiError, context: any) {
    // Log security event
    this.logger.warn('Authentication failure', {
      operation: context.operation,
      userId: context.userId,
      timestamp: new Date().toISOString()
    });
    
    // Alert security team if needed
    if (context.userId) {
      this.alertSecurityTeam('Authentication failure', { userId: context.userId });
    }
  }
  
  private handleRateLimitError(error: PcoApiError, context: any) {
    // Log rate limiting
    this.logger.warn('Rate limit exceeded', {
      operation: context.operation,
      userId: context.userId,
      retryAfter: error.getRetryDelay?.() || 'unknown'
    });
  }
  
  private handleValidationError(error: PcoApiError, context: any) {
    // Log validation errors
    this.logger.info('Validation error', {
      operation: context.operation,
      userId: context.userId,
      errors: error.errors
    });
  }
  
  private handleGenericError(error: PcoApiError, context: any) {
    // Log generic errors
    this.logger.error('Generic API error', {
      operation: context.operation,
      userId: context.userId,
      status: error.status
    });
  }
  
  private alertSecurityTeam(message: string, data: any) {
    // Implement security alerting
    console.warn('SECURITY ALERT:', message, data);
  }
}
```

### Error Recovery Strategies

```typescript
// Error recovery with fallback strategies
class ErrorRecovery {
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    context: { operation: string; maxRetries?: number }
  ): Promise<T> {
    const maxRetries = context.maxRetries || 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          // Last attempt failed, try fallback
          try {
            return await fallback();
          } catch (fallbackError) {
            throw new Error(`Operation failed after ${maxRetries} attempts and fallback failed: ${fallbackError.message}`);
          }
        }
        
        // Wait before retry
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Unexpected error in retry logic');
  }
}

// Usage
const recovery = new ErrorRecovery();

async function getPersonWithFallback(personId: string) {
  return await recovery.executeWithRecovery(
    () => client.people.getById(personId, ['emails', 'phone_numbers']),
    () => client.people.getById(personId), // Fallback without includes
    { operation: 'get_person', maxRetries: 3 }
  );
}
```

## Performance Best Practices

### Caching Strategy

**✅ Good:**

```typescript
// Multi-level caching with invalidation
class ProductionCache {
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private redisCache?: RedisClient;
  private defaultTtl = 5 * 60 * 1000; // 5 minutes
  
  constructor(redisClient?: RedisClient) {
    this.redisCache = redisClient;
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && memoryResult.expires > Date.now()) {
      return memoryResult.data;
    }
    
    // Level 2: Redis cache
    if (this.redisCache) {
      try {
        const redisResult = await this.redisCache.get(key);
        if (redisResult) {
          const data = JSON.parse(redisResult);
          // Populate memory cache
          this.memoryCache.set(key, {
            data,
            expires: Date.now() + this.defaultTtl
          });
          return data;
        }
      } catch (error) {
        console.warn('Redis cache error:', error.message);
      }
    }
    
    return null;
  }
  
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expires = Date.now() + (ttl || this.defaultTtl);
    
    // Level 1: Memory cache
    this.memoryCache.set(key, { data, expires });
    
    // Level 2: Redis cache
    if (this.redisCache) {
      try {
        await this.redisCache.setex(key, Math.floor((ttl || this.defaultTtl) / 1000), JSON.stringify(data));
      } catch (error) {
        console.warn('Redis cache error:', error.message);
      }
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate memory cache
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Invalidate Redis cache
    if (this.redisCache) {
      try {
        const keys = await this.redisCache.keys(pattern);
        if (keys.length > 0) {
          await this.redisCache.del(...keys);
        }
      } catch (error) {
        console.warn('Redis cache invalidation error:', error.message);
      }
    }
  }
}
```

### Batch Processing

**✅ Good:**

```typescript
// Production-ready batch processing
class ProductionBatchProcessor {
  private rateLimiter: SmartRateLimiter;
  private performanceMonitor: PerformanceMonitor;
  private errorHandler: ErrorHandler;
  
  constructor() {
    this.rateLimiter = new SmartRateLimiter();
    this.performanceMonitor = new PerformanceMonitor();
    this.errorHandler = new ErrorHandler();
  }
  
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      onProgress?: (completed: number, total: number) => void;
      onError?: (error: Error, item: T) => void;
    } = {}
  ): Promise<{ results: R[]; errors: any[]; metrics: any }> {
    const { batchSize = 10, maxConcurrency = 3, onProgress, onError } = options;
    const results: R[] = [];
    const errors: any[] = [];
    let completed = 0;
    
    const batches = this.createBatches(items, batchSize);
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          return await this.rateLimiter.execute(async () => {
            return await this.performanceMonitor.monitor(
              'batch_operation',
              () => processor(item)
            );
          });
        })
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const errorInfo = {
            error: result.reason.message,
            timestamp: new Date().toISOString()
          };
          errors.push(errorInfo);
          if (onError) onError(result.reason, item);
        }
      }
      
      completed += batch.length;
      if (onProgress) {
        onProgress(completed, items.length);
      }
    }
    
    return {
      results,
      errors,
      metrics: this.performanceMonitor.getMetrics()
    };
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
```

## Code Organization

### Service Layer Pattern

**✅ Good:**

```typescript
// Well-organized service layer
interface IPeopleService {
  getPeople(params?: GetPeopleParams): Promise<PersonResource[]>;
  getPerson(id: string, include?: string[]): Promise<PersonResource>;
  createPerson(data: CreatePersonData): Promise<PersonResource>;
  updatePerson(id: string, data: UpdatePersonData): Promise<PersonResource>;
  deletePerson(id: string): Promise<void>;
}

class PeopleService implements IPeopleService {
  constructor(
    private client: PcoClient,
    private cache: ProductionCache,
    private errorHandler: ErrorHandler
  ) {}
  
  async getPeople(params?: GetPeopleParams): Promise<PersonResource[]> {
    const cacheKey = `people:${JSON.stringify(params || {})}`;
    
    return await this.errorHandler.handleApiCall(
      async () => {
        // Try cache first
        const cached = await this.cache.get<PersonResource[]>(cacheKey);
        if (cached) {
          return cached;
        }
        
        // Fetch from API
        const response = await this.client.people.getAll(params);
        const people = response.data;
        
        // Cache the result
        await this.cache.set(cacheKey, people, 5 * 60 * 1000); // 5 minutes
        
        return people;
      },
      { operation: 'get_people', metadata: { params } }
    );
  }
  
  async getPerson(id: string, include?: string[]): Promise<PersonResource> {
    const cacheKey = `person:${id}:${include?.join(',') || 'default'}`;
    
    return await this.errorHandler.handleApiCall(
      async () => {
        // Try cache first
        const cached = await this.cache.get<PersonResource>(cacheKey);
        if (cached) {
          return cached;
        }
        
        // Fetch from API
        const person = await this.client.people.getById(id, include);
        
        // Cache the result
        await this.cache.set(cacheKey, person, 10 * 60 * 1000); // 10 minutes
        
        return person;
      },
      { operation: 'get_person', metadata: { id, include } }
    );
  }
  
  async createPerson(data: CreatePersonData): Promise<PersonResource> {
    return await this.errorHandler.handleApiCall(
      async () => {
        const person = await this.client.people.create(data);
        
        // Invalidate related caches
        await this.cache.invalidatePattern('people:*');
        
        return person;
      },
      { operation: 'create_person', metadata: { data } }
    );
  }
  
  async updatePerson(id: string, data: UpdatePersonData): Promise<PersonResource> {
    return await this.errorHandler.handleApiCall(
      async () => {
        const person = await this.client.people.update(id, data);
        
        // Invalidate related caches
        await this.cache.invalidatePattern(`person:${id}*`);
        await this.cache.invalidatePattern('people:*');
        
        return person;
      },
      { operation: 'update_person', metadata: { id, data } }
    );
  }
  
  async deletePerson(id: string): Promise<void> {
    return await this.errorHandler.handleApiCall(
      async () => {
        await this.client.people.delete(id);
        
        // Invalidate related caches
        await this.cache.invalidatePattern(`person:${id}*`);
        await this.cache.invalidatePattern('people:*');
      },
      { operation: 'delete_person', metadata: { id } }
    );
  }
}
```

### Dependency Injection

```typescript
// Dependency injection container
class Container {
  private services = new Map<string, any>();
  
  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }
  
  get<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }
    return factory();
  }
}

// Service registration
const container = new Container();

container.register('pcoClient', () => new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
  }
}));
container.register('cache', () => new ProductionCache(redisClient));
container.register('errorHandler', () => new ErrorHandler(logger));
container.register('peopleService', () => new PeopleService(
  container.get('pcoClient'),
  container.get('cache'),
  container.get('errorHandler')
));

// Usage
const peopleService = container.get<PeopleService>('peopleService');
```

## Testing Best Practices

### Unit Testing

**✅ Good:**

```typescript
// Comprehensive unit tests
describe('PeopleService', () => {
  let mockClient: jest.Mocked<PcoClient>;
  let mockCache: jest.Mocked<ProductionCache>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let peopleService: PeopleService;
  
  beforeEach(() => {
    mockClient = createMockPcoClient();
    mockCache = createMockCache();
    mockErrorHandler = createMockErrorHandler();
    peopleService = new PeopleService(mockClient, mockCache, mockErrorHandler);
  });
  
  describe('getPeople', () => {
    it('should return cached data when available', async () => {
      const cachedPeople = [{ id: '1', attributes: { first_name: 'John' } }];
      mockCache.get.mockResolvedValue(cachedPeople);
      
      const result = await peopleService.getPeople();
      
      expect(result).toEqual(cachedPeople);
      expect(mockCache.get).toHaveBeenCalledWith('people:{}');
      expect(mockClient.people.getAll).not.toHaveBeenCalled();
    });
    
    it('should fetch from API when cache miss', async () => {
      const apiResponse = { data: [{ id: '1', attributes: { first_name: 'John' } }] };
      mockCache.get.mockResolvedValue(null);
      mockClient.people.getAll.mockResolvedValue(apiResponse);
      
      const result = await peopleService.getPeople();
      
      expect(result).toEqual(apiResponse.data);
      expect(mockCache.set).toHaveBeenCalledWith('people:{}', apiResponse.data, 300000);
    });
    
    it('should handle errors gracefully', async () => {
      const error = new Error('API Error');
      mockCache.get.mockResolvedValue(null);
      mockClient.people.getAll.mockRejectedValue(error);
      
      await expect(peopleService.getPeople()).rejects.toThrow('API Error');
      expect(mockErrorHandler.handleApiCall).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

```typescript
// Integration tests with real API
describe('PeopleService Integration', () => {
  let client: PcoClient;
  let peopleService: PeopleService;
  
  beforeAll(() => {
    client = new PcoClient({
      auth: {
        type: 'personal_access_token',
        personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
      }
    });
    
    peopleService = new PeopleService(
      client,
      new ProductionCache(),
      new ErrorHandler(new Logger())
    );
  });
  
  it('should create and retrieve a person', async () => {
    // Create person
    const personData = {
      first_name: 'Test',
      last_name: 'User',
      status: 'active'
    };
    
    const createdPerson = await peopleService.createPerson(personData);
    expect(createdPerson.attributes.first_name).toBe('Test');
    
    // Retrieve person
    const retrievedPerson = await peopleService.getPerson(createdPerson.id);
    expect(retrievedPerson.id).toBe(createdPerson.id);
    expect(retrievedPerson.attributes.first_name).toBe('Test');
    
    // Cleanup
    await peopleService.deletePerson(createdPerson.id);
  });
});
```

## Monitoring & Observability

### Metrics Collection

```typescript
// Comprehensive metrics collection
class MetricsCollector {
  private metrics = new Map<string, number[]>();
  
  recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    const key = `${name}:${JSON.stringify(tags)}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(value);
  }
  
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, values] of this.metrics) {
      const [name, tagsStr] = key.split(':');
      const tags = JSON.parse(tagsStr);
      
      if (!result[name]) {
        result[name] = {};
      }
      
      const tagKey = Object.entries(tags).map(([k, v]) => `${k}=${v}`).join(',');
      result[name][tagKey] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95),
        p99: this.percentile(values, 0.99)
      };
    }
    
    return result;
  }
  
  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Usage in service
class InstrumentedPeopleService extends PeopleService {
  constructor(
    client: PcoClient,
    cache: ProductionCache,
    errorHandler: ErrorHandler,
    private metrics: MetricsCollector
  ) {
    super(client, cache, errorHandler);
  }
  
  async getPeople(params?: GetPeopleParams): Promise<PersonResource[]> {
    const start = Date.now();
    
    try {
      const result = await super.getPeople(params);
      const duration = Date.now() - start;
      
      this.metrics.recordMetric('api_call_duration', duration, {
        operation: 'get_people',
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.metrics.recordMetric('api_call_duration', duration, {
        operation: 'get_people',
        status: 'error'
      });
      
      throw error;
    }
  }
}
```

### Logging Best Practices

```typescript
// Structured logging
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private context: Record<string, any> = {};
  
  setContext(key: string, value: any): void {
    this.context[key] = value;
  }
  
  log(level: LogEntry['level'], message: string, metadata: Record<string, any> = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...metadata
    };
    
    console.log(JSON.stringify(entry));
  }
  
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }
  
  error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }
}

// Usage
const logger = new StructuredLogger();

// Set request context
logger.setContext('requestId', generateRequestId());
logger.setContext('userId', 'user123');

// Log operations
logger.info('Starting API call', { operation: 'get_people' });
logger.error('API call failed', { error: error.message, operation: 'get_people' });
```

## Deployment Best Practices

### Environment Configuration

```typescript
// Environment-specific configuration
class EnvironmentConfig {
  static get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
  
  static get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
  
  static get isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
  
  static get pcoConfig() {
    return {
      auth: {
        type: 'personal_access_token' as const,
        personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
      },
      timeout: this.isProduction ? 30000 : 60000,
      rateLimit: {
        maxRequests: this.isProduction ? 90 : 50,
        perMilliseconds: 60000
      }
    };
  }
  
  static get cacheConfig() {
    return {
      ttl: this.isProduction ? 5 * 60 * 1000 : 1 * 60 * 1000, // 5min prod, 1min dev
      maxSize: this.isProduction ? 1000 : 100
    };
  }
  
  static get loggingConfig() {
    return {
      level: this.isProduction ? 'info' : 'debug',
      enableConsole: !this.isProduction,
      enableFile: this.isProduction
    };
  }
}
```

### Health Checks and Monitoring

```typescript
// Production health checks
export async function productionHealthCheck(req: Request, res: Response) {
  const checks = await Promise.allSettled([
    checkPcoApi(),
    checkDatabase(),
    checkCache(),
    checkExternalServices()
  ]);
  
  const results = checks.map((check, index) => ({
    service: ['pco', 'database', 'cache', 'external'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    details: check.status === 'fulfilled' ? check.value : check.reason
  }));
  
  const overallHealth = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';
  
  res.status(overallHealth === 'healthy' ? 200 : 503).json({
    status: overallHealth,
    timestamp: new Date().toISOString(),
    checks: results,
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
}

async function checkPcoApi(): Promise<{ latency: number; status: string }> {
  const start = Date.now();
  try {
    const client = new PcoClient({
      auth: {
        type: 'personal_access_token',
        personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!
      }
    });
    
    await client.organization.get();
    const latency = Date.now() - start;
    return { latency, status: 'healthy' };
  } catch (error) {
    return { latency: Date.now() - start, status: 'unhealthy', error: error.message };
  }
}
```

## Maintenance & Updates

### Version Management

```typescript
// Version management and updates
class VersionManager {
  static get currentVersion(): string {
    return process.env.npm_package_version || '2.0.0';
  }
  
  static async checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion?: string }> {
    try {
      const response = await fetch('https://registry.npmjs.org/@rachelallyson/planning-center-people-ts');
      const data = await response.json();
      const latestVersion = data['dist-tags'].latest;
      
      return {
        hasUpdate: latestVersion !== this.currentVersion,
        latestVersion
      };
    } catch (error) {
      console.warn('Failed to check for updates:', error.message);
      return { hasUpdate: false };
    }
  }
  
  static logVersionInfo(): void {
    console.log(`PCO Library Version: ${this.currentVersion}`);
    console.log(`Node.js Version: ${process.version}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  }
}
```

### Deprecation Handling

```typescript
// Handle deprecated features gracefully
class DeprecationManager {
  private static deprecatedFeatures = new Map<string, { version: string; replacement?: string }>();
  
  static markDeprecated(feature: string, version: string, replacement?: string): void {
    this.deprecatedFeatures.set(feature, { version, replacement });
  }
  
  static checkDeprecation(feature: string): void {
    const deprecation = this.deprecatedFeatures.get(feature);
    if (deprecation) {
      const message = `Feature '${feature}' is deprecated since version ${deprecation.version}`;
      const replacement = deprecation.replacement ? ` Use '${deprecation.replacement}' instead.` : '';
      
      console.warn(`DEPRECATION WARNING: ${message}${replacement}`);
    }
  }
}

// Usage
DeprecationManager.markDeprecated('oldMethod', '2.0.0', 'newMethod');

function oldMethod() {
  DeprecationManager.checkDeprecation('oldMethod');
  // Implementation
}
```

## Next Steps

After implementing these best practices:

1. **Monitor Performance**: Set up monitoring and alerting for your production environment
2. **Regular Updates**: Keep the library and dependencies updated
3. **Security Audits**: Regularly audit your implementation for security issues
4. **Performance Testing**: Conduct regular performance testing
5. **Documentation**: Keep your team documentation updated

## Getting Help

For questions about best practices:

1. **Check this guide** for your specific use case
2. **Review Examples** for real-world implementations
3. **Check the API Reference** for method details
4. **Open an issue** on GitHub for specific questions

---

*This best practices guide provides comprehensive guidance for production usage of v2.0.0. For specific questions or scenarios, please [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues) with details about your use case.*
