# Performance Optimization Guide

This guide covers performance optimization techniques, bulk operations, caching strategies, and best practices for high-performance applications using the Planning Center People TypeScript library.

## Table of Contents

1. [Performance Fundamentals](#performance-fundamentals)
2. [Rate Limiting & Throttling](#rate-limiting--throttling)
3. [Batch Operations](#batch-operations)
4. [Caching Strategies](#caching-strategies)
5. [Streaming & Pagination](#streaming--pagination)
6. [Concurrent Operations](#concurrent-operations)
7. [Memory Optimization](#memory-optimization)
8. [Performance Monitoring](#performance-monitoring)
9. [Production Optimization](#production-optimization)

## Performance Fundamentals

### Understanding PCO API Limits

The Planning Center API has specific rate limits and performance characteristics:

- **Rate Limit**: 100 requests per minute per app
- **Pagination**: Default 25 items per page, maximum 100
- **Timeout**: 30 seconds default, configurable
- **Concurrent Requests**: No official limit, but respect rate limits

### Performance Metrics

```typescript
import { monitorPerformance, PerformanceMonitor } from '@rachelallyson/planning-center-people-ts';

// Basic performance monitoring
async function monitoredOperation() {
  return await monitorPerformance(
    async () => {
      const people = await getPeople(client, { per_page: 100 });
      return people.data;
    },
    {
      operation: 'get_people',
      metadata: { batch_size: 100 }
    }
  );
}

// Advanced performance monitoring
class PerformanceTracker {
  private metrics = new Map<string, number[]>();
  
  async track<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.recordMetric(operation, duration);
      console.log(`${operation} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(`${operation}_error`, duration);
      throw error;
    }
  }
  
  private recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }
  
  getStats(operation: string) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;
    
    const sorted = durations.sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    
    return {
      count: durations.length,
      average: sum / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

// Usage
const tracker = new PerformanceTracker();

async function getPeopleWithTracking() {
  return await tracker.track('get_people', async () => {
    return await getPeople(client, { per_page: 100 });
  });
}
```

## Rate Limiting & Throttling

### Adaptive Rate Limiting

```typescript
import { AdaptiveRateLimiter } from '@rachelallyson/planning-center-people-ts';

// Adaptive rate limiter that adjusts based on API responses
class SmartRateLimiter {
  private requests: number[] = [];
  private windowSize = 60000; // 1 minute
  private maxRequests = 90; // Leave some headroom
  private backoffMultiplier = 1.5;
  private currentBackoff = 1000;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.waitIfNeeded();
    
    const start = Date.now();
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  private async waitIfNeeded() {
    this.cleanOldRequests();
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowSize - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(Date.now());
  }
  
  private cleanOldRequests() {
    const cutoff = Date.now() - this.windowSize;
    this.requests = this.requests.filter(time => time > cutoff);
  }
  
  private onSuccess() {
    // Gradually reduce backoff on success
    this.currentBackoff = Math.max(1000, this.currentBackoff * 0.9);
  }
  
  private onError(error: any) {
    if (error.status === 429) {
      // Increase backoff on rate limit errors
      this.currentBackoff = Math.min(30000, this.currentBackoff * this.backoffMultiplier);
      console.log(`Rate limited, increasing backoff to ${this.currentBackoff}ms`);
    }
  }
  
  getStatus() {
    this.cleanOldRequests();
    return {
      requestsInWindow: this.requests.length,
      maxRequests: this.maxRequests,
      currentBackoff: this.currentBackoff,
      windowResetsIn: this.requests.length > 0 ? 
        this.windowSize - (Date.now() - this.requests[0]) : 0
    };
  }
}

// Usage
const rateLimiter = new SmartRateLimiter();

async function rateLimitedApiCall<T>(operation: () => Promise<T>): Promise<T> {
  return await rateLimiter.execute(operation);
}
```

### Request Throttling

```typescript
// Request throttling with priority queues
class RequestThrottler {
  private queues = {
    high: [] as Array<() => Promise<any>>,
    normal: [] as Array<() => Promise<any>>,
    low: [] as Array<() => Promise<any>>
  };
  
  private isProcessing = false;
  private maxConcurrent = 5;
  private activeRequests = 0;
  
  async add<T>(
    operation: () => Promise<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queues[priority].push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.isProcessing || this.activeRequests >= this.maxConcurrent) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.activeRequests < this.maxConcurrent) {
      const operation = this.getNextOperation();
      if (!operation) break;
      
      this.activeRequests++;
      operation().finally(() => {
        this.activeRequests--;
        this.processQueue();
      });
    }
    
    this.isProcessing = false;
  }
  
  private getNextOperation(): (() => Promise<any>) | null {
    // Process high priority first, then normal, then low
    for (const priority of ['high', 'normal', 'low'] as const) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift()!;
      }
    }
    return null;
  }
  
  getQueueStatus() {
    return {
      high: this.queues.high.length,
      normal: this.queues.normal.length,
      low: this.queues.low.length,
      active: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Usage
const throttler = new RequestThrottler();

async function throttledGetPerson(personId: string, priority: 'high' | 'normal' | 'low' = 'normal') {
  return await throttler.add(
    () => getPerson(client, personId),
    priority
  );
}
```

## Batch Operations

### Efficient Batch Processing

```typescript
import { 
  batchFetchPersonDetails, 
  processInBatches,
  processLargeDataset 
} from '@rachelallyson/planning-center-people-ts';

// Batch fetch multiple people efficiently
async function batchGetPeople(personIds: string[]) {
  return await batchFetchPersonDetails(client, personIds, {
    batchSize: 10,
    delayBetweenBatches: 1000,
    include: ['emails', 'phone_numbers']
  });
}

// Process large datasets in batches
async function processAllPeople(processor: (person: any) => Promise<any>) {
  return await processLargeDataset(
    client,
    '/people',
    processor,
    {
      batchSize: 50,
      concurrency: 3,
      delayBetweenBatches: 2000
    }
  );
}

// Custom batch processing with progress tracking
class BatchProcessor {
  private results: any[] = [];
  private errors: any[] = [];
  
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
      onError?: (error: Error, item: T) => void;
    } = {}
  ): Promise<{ results: R[]; errors: any[] }> {
    const {
      batchSize = 10,
      concurrency = 3,
      onProgress,
      onError
    } = options;
    
    this.results = [];
    this.errors = [];
    
    const batches = this.createBatches(items, batchSize);
    let completed = 0;
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await processor(item);
          this.results.push(result);
          return result;
        } catch (error) {
          const errorInfo = { error: error.message, item };
          this.errors.push(errorInfo);
          if (onError) onError(error as Error, item);
          return null;
        }
      });
      
      await Promise.all(batchPromises);
      completed += batch.length;
      
      if (onProgress) {
        onProgress(completed, items.length);
      }
      
      // Delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return {
      results: this.results,
      errors: this.errors
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

// Usage
const batchProcessor = new BatchProcessor();

async function updateMultiplePeople(peopleUpdates: Array<{ id: string; data: any }>) {
  const { results, errors } = await batchProcessor.processBatch(
    peopleUpdates,
    async (update) => {
      return await updatePerson(client, update.id, update.data);
    },
    {
      batchSize: 5,
      concurrency: 2,
      onProgress: (completed, total) => {
        console.log(`Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
      },
      onError: (error, update) => {
        console.error(`Failed to update person ${update.id}:`, error.message);
      }
    }
  );
  
  console.log(`Updated ${results.length} people successfully`);
  if (errors.length > 0) {
    console.log(`Failed to update ${errors.length} people`);
  }
  
  return { results, errors };
}
```

### Parallel Batch Operations

```typescript
// Parallel batch processing with controlled concurrency
class ParallelBatchProcessor {
  private semaphore: Semaphore;
  
  constructor(maxConcurrency: number = 5) {
    this.semaphore = new Semaphore(maxConcurrency);
  }
  
  async processParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<{ results: R[]; errors: any[] }> {
    const { batchSize = 10, onProgress } = options;
    const results: R[] = [];
    const errors: any[] = [];
    let completed = 0;
    
    const batches = this.createBatches(items, batchSize);
    const batchPromises = batches.map(async (batch, batchIndex) => {
      await this.semaphore.acquire();
      
      try {
        const batchResults = await Promise.allSettled(
          batch.map(item => processor(item))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              error: result.reason.message,
              item: batch[index]
            });
          }
        });
        
        completed += batch.length;
        if (onProgress) {
          onProgress(completed, items.length);
        }
      } finally {
        this.semaphore.release();
      }
    });
    
    await Promise.all(batchPromises);
    
    return { results, errors };
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

// Semaphore implementation for concurrency control
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }
  
  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

// Usage
const parallelProcessor = new ParallelBatchProcessor(3);

async function parallelUpdatePeople(peopleUpdates: Array<{ id: string; data: any }>) {
  const { results, errors } = await parallelProcessor.processParallel(
    peopleUpdates,
    async (update) => {
      return await updatePerson(client, update.id, update.data);
    },
    {
      batchSize: 5,
      onProgress: (completed, total) => {
        console.log(`Progress: ${completed}/${total}`);
      }
    }
  );
  
  return { results, errors };
}
```

## Caching Strategies

### Multi-Level Caching

```typescript
import { ApiCache } from '@rachelallyson/planning-center-people-ts';

// Multi-level cache implementation
class MultiLevelCache {
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private redisCache?: any; // Redis client if available
  private defaultTtl = 5 * 60 * 1000; // 5 minutes
  
  constructor(redisClient?: any) {
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
  
  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.redisCache) {
      try {
        await this.redisCache.del(key);
      } catch (error) {
        console.warn('Redis cache error:', error.message);
      }
    }
  }
  
  clear(): void {
    this.memoryCache.clear();
  }
  
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys())
    };
  }
}

// Cache-aware API client
class CachedPcoClient {
  private cache: MultiLevelCache;
  
  constructor(client: PcoClientState, cache: MultiLevelCache) {
    this.client = client;
    this.cache = cache;
  }
  
  async getPerson(personId: string, include?: string[]): Promise<any> {
    const cacheKey = `person:${personId}:${include?.join(',') || 'default'}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for person:', personId);
      return cached;
    }
    
    // Fetch from API
    console.log('Cache miss for person:', personId);
    const person = await getPerson(this.client, personId, include);
    
    // Cache the result
    await this.cache.set(cacheKey, person, 10 * 60 * 1000); // 10 minutes
    
    return person;
  }
  
  async getPeople(params?: any): Promise<any> {
    const cacheKey = `people:${JSON.stringify(params || {})}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const people = await getPeople(this.client, params);
    await this.cache.set(cacheKey, people, 5 * 60 * 1000); // 5 minutes
    
    return people;
  }
  
  async invalidatePerson(personId: string): Promise<void> {
    // Invalidate all cache entries for this person
    const stats = this.cache.getStats();
    for (const key of stats.memoryKeys) {
      if (key.includes(`person:${personId}`)) {
        await this.cache.invalidate(key);
      }
    }
  }
}

// Usage
const cache = new MultiLevelCache(); // Add Redis client if available
const cachedClient = new CachedPcoClient(client, cache);

async function getCachedPerson(personId: string) {
  return await cachedClient.getPerson(personId, ['emails', 'phone_numbers']);
}
```

### Cache Invalidation Strategies

```typescript
// Smart cache invalidation
class CacheInvalidationManager {
  private cache: MultiLevelCache;
  private invalidationRules = new Map<string, string[]>();
  
  constructor(cache: MultiLevelCache) {
    this.cache = cache;
    this.setupInvalidationRules();
  }
  
  private setupInvalidationRules() {
    // When a person is updated, invalidate related caches
    this.invalidationRules.set('person:update', [
      'person:*',
      'people:*',
      'household:*'
    ]);
    
    this.invalidationRules.set('person:create', [
      'people:*'
    ]);
    
    this.invalidationRules.set('person:delete', [
      'person:*',
      'people:*',
      'household:*'
    ]);
  }
  
  async invalidateByPattern(pattern: string): Promise<void> {
    const stats = this.cache.getStats();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of stats.memoryKeys) {
      if (regex.test(key)) {
        await this.cache.invalidate(key);
      }
    }
  }
  
  async invalidateByEvent(event: string, context?: any): Promise<void> {
    const patterns = this.invalidationRules.get(event) || [];
    
    for (const pattern of patterns) {
      await this.invalidateByPattern(pattern);
    }
    
    // Custom invalidation based on context
    if (context?.personId) {
      await this.invalidateByPattern(`person:${context.personId}*`);
    }
  }
  
  // Hook into API operations
  async withInvalidation<T>(
    operation: () => Promise<T>,
    event: string,
    context?: any
  ): Promise<T> {
    const result = await operation();
    await this.invalidateByEvent(event, context);
    return result;
  }
}

// Usage
const invalidationManager = new CacheInvalidationManager(cache);

async function updatePersonWithCacheInvalidation(personId: string, data: any) {
  return await invalidationManager.withInvalidation(
    () => updatePerson(client, personId, data),
    'person:update',
    { personId }
  );
}
```

## Streaming & Pagination

### Efficient Data Streaming

```typescript
import { streamPeopleData, fetchAllPages } from '@rachelallyson/planning-center-people-ts';

// Stream large datasets
async function streamAllPeople(processor: (person: any) => Promise<void>) {
  const peopleStream = streamPeopleData(client, {
    per_page: 100,
    include: ['emails']
  });
  
  let processedCount = 0;
  const batchSize = 50;
  let batch: any[] = [];
  
  for await (const person of peopleStream) {
    batch.push(person);
    
    if (batch.length >= batchSize) {
      // Process batch
      await Promise.all(batch.map(processor));
      processedCount += batch.length;
      console.log(`Processed ${processedCount} people`);
      batch = [];
    }
  }
  
  // Process remaining items
  if (batch.length > 0) {
    await Promise.all(batch.map(processor));
    processedCount += batch.length;
  }
  
  console.log(`Total processed: ${processedCount} people`);
}

// Custom streaming with backpressure
class StreamingProcessor {
  private buffer: any[] = [];
  private maxBufferSize = 100;
  private isProcessing = false;
  
  async processStream<T>(
    stream: AsyncGenerator<T>,
    processor: (item: T) => Promise<void>,
    options: {
      concurrency?: number;
      onProgress?: (processed: number) => void;
    } = {}
  ): Promise<void> {
    const { concurrency = 5, onProgress } = options;
    let processedCount = 0;
    
    const processBuffer = async () => {
      if (this.isProcessing || this.buffer.length === 0) return;
      
      this.isProcessing = true;
      
      while (this.buffer.length > 0) {
        const batch = this.buffer.splice(0, concurrency);
        
        await Promise.all(
          batch.map(async (item) => {
            try {
              await processor(item);
              processedCount++;
              if (onProgress) onProgress(processedCount);
            } catch (error) {
              console.error('Stream processing error:', error);
            }
          })
        );
      }
      
      this.isProcessing = false;
    };
    
    // Start processing loop
    const processingLoop = setInterval(processBuffer, 100);
    
    try {
      for await (const item of stream) {
        this.buffer.push(item);
        
        if (this.buffer.length >= this.maxBufferSize) {
          await processBuffer();
        }
      }
      
      // Process remaining items
      await processBuffer();
    } finally {
      clearInterval(processingLoop);
    }
  }
}

// Usage
const streamingProcessor = new StreamingProcessor();

async function processPeopleStream() {
  const peopleStream = streamPeopleData(client, { per_page: 100 });
  
  await streamingProcessor.processStream(
    peopleStream,
    async (person) => {
      // Process each person
      console.log(`Processing ${person.attributes.first_name} ${person.attributes.last_name}`);
    },
    {
      concurrency: 10,
      onProgress: (count) => console.log(`Processed ${count} people`)
    }
  );
}
```

### Smart Pagination

```typescript
// Smart pagination with automatic optimization
class SmartPagination {
  private client: PcoClientState;
  private pageSize = 25;
  private maxPageSize = 100;
  
  constructor(client: PcoClientState) {
    this.client = client;
  }
  
  async getAllPages<T>(
    endpoint: string,
    options: {
      include?: string[];
      where?: any;
      onProgress?: (page: number, totalPages?: number) => void;
      adaptivePageSize?: boolean;
    } = {}
  ): Promise<T[]> {
    const { include, where, onProgress, adaptivePageSize = true } = options;
    const allItems: T[] = [];
    let page = 1;
    let totalPages: number | undefined;
    let currentPageSize = this.pageSize;
    
    while (true) {
      const params: any = {
        page,
        per_page: currentPageSize
      };
      
      if (include) params.include = include.join(',');
      if (where) params.where = where;
      
      const response = await getList<T>(this.client, endpoint, params);
      
      allItems.push(...response.data);
      
      if (onProgress) {
        onProgress(page, totalPages);
      }
      
      // Update total pages from response
      if (response.meta?.total && !totalPages) {
        totalPages = Math.ceil(response.meta.total / currentPageSize);
      }
      
      // Check if we've reached the end
      if (!response.links?.next || response.data.length === 0) {
        break;
      }
      
      page++;
      
      // Adaptive page size based on response time
      if (adaptivePageSize && page > 1) {
        // Increase page size if responses are fast
        currentPageSize = Math.min(this.maxPageSize, currentPageSize * 1.2);
      }
    }
    
    return allItems;
  }
  
  async getPagesInParallel<T>(
    endpoint: string,
    options: {
      include?: string[];
      where?: any;
      maxConcurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<T[]> {
    const { include, where, maxConcurrency = 3, onProgress } = options;
    
    // First, get the first page to determine total pages
    const firstPage = await getList<T>(this.client, endpoint, {
      page: 1,
      per_page: this.maxPageSize,
      include: include?.join(','),
      where
    });
    
    const totalItems = firstPage.meta?.total || 0;
    const totalPages = Math.ceil(totalItems / this.maxPageSize);
    
    if (totalPages <= 1) {
      return firstPage.data;
    }
    
    // Create page requests
    const pageRequests = [];
    for (let page = 2; page <= totalPages; page++) {
      pageRequests.push(
        getList<T>(this.client, endpoint, {
          page,
          per_page: this.maxPageSize,
          include: include?.join(','),
          where
        })
      );
    }
    
    // Process pages in parallel with controlled concurrency
    const allItems = [...firstPage.data];
    let completed = 1;
    
    for (let i = 0; i < pageRequests.length; i += maxConcurrency) {
      const batch = pageRequests.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch);
      
      for (const result of batchResults) {
        allItems.push(...result.data);
        completed++;
        if (onProgress) {
          onProgress(completed, totalPages);
        }
      }
    }
    
    return allItems;
  }
}

// Usage
const smartPagination = new SmartPagination(client);

async function getAllPeopleEfficiently() {
  return await smartPagination.getAllPages('/people', {
    include: ['emails', 'phone_numbers'],
    onProgress: (page, totalPages) => {
      console.log(`Fetched page ${page}${totalPages ? ` of ${totalPages}` : ''}`);
    },
    adaptivePageSize: true
  });
}
```

## Concurrent Operations

### Controlled Concurrency

```typescript
// Advanced concurrency control
class ConcurrencyController {
  private activeOperations = new Map<string, Promise<any>>();
  private maxConcurrency: number;
  private operationQueues = new Map<string, Array<() => Promise<any>>>();
  
  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }
  
  async execute<T>(
    operation: () => Promise<T>,
    key?: string
  ): Promise<T> {
    if (!key) {
      return await this.executeWithSemaphore(operation);
    }
    
    // Check if operation with same key is already running
    if (this.activeOperations.has(key)) {
      return await this.activeOperations.get(key);
    }
    
    const promise = this.executeWithSemaphore(operation);
    this.activeOperations.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.activeOperations.delete(key);
    }
  }
  
  private async executeWithSemaphore<T>(operation: () => Promise<T>): Promise<T> {
    // Simple semaphore implementation
    while (this.activeOperations.size >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return await operation();
  }
  
  getStatus() {
    return {
      activeOperations: this.activeOperations.size,
      maxConcurrency: this.maxConcurrency,
      activeKeys: Array.from(this.activeOperations.keys())
    };
  }
}

// Usage
const concurrencyController = new ConcurrencyController(3);

async function getPersonWithDeduplication(personId: string) {
  return await concurrencyController.execute(
    () => getPerson(client, personId),
    `person:${personId}`
  );
}
```

### Operation Queuing

```typescript
// Priority-based operation queuing
class OperationQueue {
  private queues = {
    critical: [] as Array<() => Promise<any>>,
    high: [] as Array<() => Promise<any>>,
    normal: [] as Array<() => Promise<any>>,
    low: [] as Array<() => Promise<any>>
  };
  
  private isProcessing = false;
  private maxConcurrent = 5;
  private activeOperations = 0;
  
  async enqueue<T>(
    operation: () => Promise<T>,
    priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queues[priority].push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.isProcessing || this.activeOperations >= this.maxConcurrent) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.activeOperations < this.maxConcurrent) {
      const operation = this.getNextOperation();
      if (!operation) break;
      
      this.activeOperations++;
      operation().finally(() => {
        this.activeOperations--;
        this.processQueue();
      });
    }
    
    this.isProcessing = false;
  }
  
  private getNextOperation(): (() => Promise<any>) | null {
    const priorities: Array<keyof typeof this.queues> = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift()!;
      }
    }
    
    return null;
  }
  
  getQueueStatus() {
    return {
      critical: this.queues.critical.length,
      high: this.queues.high.length,
      normal: this.queues.normal.length,
      low: this.queues.low.length,
      active: this.activeOperations,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Usage
const operationQueue = new OperationQueue();

async function queuePersonOperation(personId: string, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal') {
  return await operationQueue.enqueue(
    () => getPerson(client, personId),
    priority
  );
}
```

## Memory Optimization

### Memory-Efficient Processing

```typescript
// Memory-efficient data processing
class MemoryEfficientProcessor {
  private maxMemoryUsage = 100 * 1024 * 1024; // 100MB
  private currentMemoryUsage = 0;
  
  async processLargeDataset<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      memoryThreshold?: number;
      onMemoryWarning?: () => void;
    } = {}
  ): Promise<R[]> {
    const { batchSize = 1000, memoryThreshold = 0.8, onMemoryWarning } = options;
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Check memory usage
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage > memoryThreshold) {
        console.warn('High memory usage detected:', memoryUsage);
        if (onMemoryWarning) onMemoryWarning();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      // Process batch
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // Clear batch from memory
      batch.length = 0;
    }
    
    return results;
  }
  
  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return used.heapUsed / this.maxMemoryUsage;
  }
  
  // Stream processing to avoid loading everything into memory
  async processStream<T, R>(
    stream: AsyncGenerator<T>,
    processor: (item: T) => Promise<R>,
    options: {
      maxBufferSize?: number;
      onItemProcessed?: (item: T, result: R) => void;
    } = {}
  ): Promise<void> {
    const { maxBufferSize = 100, onItemProcessed } = options;
    const buffer: Array<{ item: T; promise: Promise<R> }> = [];
    
    for await (const item of stream) {
      const promise = processor(item);
      buffer.push({ item, promise });
      
      if (buffer.length >= maxBufferSize) {
        // Process buffer
        for (const { item, promise } of buffer) {
          try {
            const result = await promise;
            if (onItemProcessed) onItemProcessed(item, result);
          } catch (error) {
            console.error('Stream processing error:', error);
          }
        }
        
        buffer.length = 0; // Clear buffer
      }
    }
    
    // Process remaining items
    for (const { item, promise } of buffer) {
      try {
        const result = await promise;
        if (onItemProcessed) onItemProcessed(item, result);
      } catch (error) {
        console.error('Stream processing error:', error);
      }
    }
  }
}

// Usage
const memoryProcessor = new MemoryEfficientProcessor();

async function processAllPeopleMemoryEfficiently() {
  const peopleStream = streamPeopleData(client, { per_page: 100 });
  
  await memoryProcessor.processStream(
    peopleStream,
    async (person) => {
      // Process each person without loading all into memory
      return await processPerson(person);
    },
    {
      maxBufferSize: 50,
      onItemProcessed: (person, result) => {
        console.log(`Processed ${person.attributes.first_name} ${person.attributes.last_name}`);
      }
    }
  );
}
```

## Performance Monitoring

### Real-time Performance Monitoring

```typescript
// Real-time performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, {
    count: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
    errors: number;
  }>();
  
  private alerts: Array<{
    condition: (metrics: any) => boolean;
    message: string;
    callback: (metrics: any) => void;
  }> = [];
  
  async monitor<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      this.recordMetric(operation, duration, false);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration, true);
      throw error;
    }
  }
  
  private recordMetric(operation: string, duration: number, isError: boolean) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0
      });
    }
    
    const metric = this.metrics.get(operation)!;
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    
    if (isError) {
      metric.errors++;
    }
    
    // Check alerts
    this.checkAlerts(operation, metric);
  }
  
  private checkAlerts(operation: string, metric: any) {
    for (const alert of this.alerts) {
      if (alert.condition(metric)) {
        alert.callback({ operation, ...metric });
      }
    }
  }
  
  addAlert(condition: (metrics: any) => boolean, message: string, callback: (metrics: any) => void) {
    this.alerts.push({ condition, message, callback });
  }
  
  getMetrics(operation?: string) {
    if (operation) {
      const metric = this.metrics.get(operation);
      return metric ? this.calculateStats(metric) : null;
    }
    
    const allMetrics: Record<string, any> = {};
    for (const [op, metric] of this.metrics) {
      allMetrics[op] = this.calculateStats(metric);
    }
    return allMetrics;
  }
  
  private calculateStats(metric: any) {
    return {
      count: metric.count,
      averageTime: metric.totalTime / metric.count,
      minTime: metric.minTime === Infinity ? 0 : metric.minTime,
      maxTime: metric.maxTime,
      errorRate: metric.errors / metric.count,
      totalTime: metric.totalTime
    };
  }
  
  reset() {
    this.metrics.clear();
  }
}

// Usage
const performanceMonitor = new PerformanceMonitor();

// Add performance alerts
performanceMonitor.addAlert(
  (metrics) => metrics.averageTime > 5000,
  'Slow operation detected',
  (data) => console.warn(`Slow operation: ${data.operation} averaging ${data.averageTime}ms`)
);

performanceMonitor.addAlert(
  (metrics) => metrics.errorRate > 0.1,
  'High error rate detected',
  (data) => console.error(`High error rate: ${data.operation} has ${(data.errorRate * 100).toFixed(1)}% errors`)
);

async function monitoredGetPerson(personId: string) {
  return await performanceMonitor.monitor(
    'get_person',
    () => getPerson(client, personId)
  );
}
```

## Production Optimization

### Production-Ready Configuration

```typescript
// Production-optimized client configuration
function createProductionClient() {
  return createPcoClient({
    appId: process.env.PCO_APP_ID!,
    appSecret: process.env.PCO_APP_SECRET!,
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
    
    // Performance optimizations
    timeout: 30000,
    rateLimit: {
      maxRequests: 90, // Leave headroom
      perMilliseconds: 60000
    },
    
    // Retry configuration
    retry: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      onRetry: (error, attempt) => {
        console.log(`Retry attempt ${attempt}:`, error.message);
      }
    },
    
    // Custom headers for monitoring
    headers: {
      'User-Agent': `MyApp/1.0.0 (${process.env.NODE_ENV})`,
      'X-Request-ID': () => generateRequestId()
    }
  });
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Production-ready batch processor
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
    } = {}
  ): Promise<{ results: R[]; errors: any[]; metrics: any }> {
    const { batchSize = 10, maxConcurrency = 3, onProgress } = options;
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
          errors.push({
            error: result.reason.message,
            timestamp: new Date().toISOString()
          });
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

// Usage
const productionProcessor = new ProductionBatchProcessor();

async function productionBatchUpdate(peopleUpdates: Array<{ id: string; data: any }>) {
  const { results, errors, metrics } = await productionProcessor.processBatch(
    peopleUpdates,
    async (update) => {
      return await updatePerson(client, update.id, update.data);
    },
    {
      batchSize: 5,
      maxConcurrency: 2,
      onProgress: (completed, total) => {
        console.log(`Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
      }
    }
  );
  
  console.log('Batch processing completed:', {
    successful: results.length,
    failed: errors.length,
    metrics
  });
  
  return { results, errors, metrics };
}
```

## Next Steps

- 🔧 **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
- 📚 **[API Reference](./API_REFERENCE.md)** - Complete function reference
- 💡 **[Examples](./EXAMPLES.md)** - Real-world usage patterns
- 🛠️ **[Error Handling](./ERROR_HANDLING.md)** - Advanced error management

---

*This performance guide provides comprehensive optimization techniques for high-performance applications. For specific performance issues or questions, check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/rachelallyson/planning-center-people-ts/issues).*
