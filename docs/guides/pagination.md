# Pagination Guide

This guide explains how to handle paginated responses from the Planning Center API.

## Understanding Pagination

Planning Center API uses **offset-based pagination** with JSON:API links:

```typescript
{
  data: [/* resources */],
  links: {
    self: '/people?page=1&per_page=25',
    first: '/people?page=1&per_page=25',
    prev: null,
    next: '/people?page=2&per_page=25',
    last: '/people?page=10&per_page=25'
  },
  meta: {
    total_count: 245,
    total_pages: 10
  }
}
```

### Response Structure

- **`data`**: Array of resource objects
- **`links`**: Pagination links object
  - `self`: Current page URL
  - `first`: First page URL
  - `prev`: Previous page URL (null if first page)
  - `next`: Next page URL (null if last page)
  - `last`: Last page URL
- **`meta`**: Optional metadata (total_count, total_pages)

## Pagination Methods

### Method 1: Automatic Pagination (Recommended)

Use `getAllPages()` to fetch all pages automatically:

```typescript
// Fetches all pages automatically
const result = await client.people.getAllPages({
  perPage: 25,
  include: ['emails', 'phone_numbers']
});

console.log(`Total people: ${result.data.length}`);
console.log(`Total pages fetched: ${result.meta?.total_pages}`);

// Process all people
result.data.forEach(person => {
  console.log(person.attributes.first_name);
});
```

**When to use**:

- You need all data
- Dataset is reasonably sized (< 10,000 records)
- You want simplicity

**Limitations**:

- Fetches all pages (may be slow for large datasets)
- Uses more memory (all data in memory)

### Method 2: Manual Pagination

Fetch pages one at a time for more control:

```typescript
let page = 1;
let hasMore = true;
const allPeople: PersonResource[] = [];

while (hasMore) {
  const response = await client.people.getAll({
    perPage: 25,
    page: page,
    include: ['emails']
  });

  // Add to collection
  allPeople.push(...response.data);

  // Check if more pages exist
  hasMore = response.links?.next !== undefined && response.links?.next !== null;

  // Increment page
  page++;

  // Optional: Show progress
  console.log(`Fetched page ${page - 1}/${response.meta?.total_pages}`);
}
```

**When to use**:

- You want control over pagination
- You need to process data incrementally
- You want to show progress to users
- You may need to stop early

### Method 3: Stream Processing (Large Datasets)

For very large datasets, process data as you fetch:

```typescript
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await client.people.getAll({
    perPage: 100, // Larger page size for efficiency
    page: page
  });

  // Process page immediately
  await processPeopleBatch(response.data);

  // Check for next page
  hasMore = response.links?.next !== undefined && response.links?.next !== null;
  page++;
}

async function processPeopleBatch(people: PersonResource[]) {
  // Process batch (e.g., save to database, send to queue)
  for (const person of people) {
    await savePersonToDatabase(person);
  }
}
```

**When to use**:

- Very large datasets (> 10,000 records)
- Memory constraints
- You need to process data incrementally
- You want to avoid holding all data in memory

## Pagination Parameters

### `perPage`

Number of items per page (default: 25, max: 100).

```typescript
// Get 50 items per page
const response = await client.people.getAll({ perPage: 50 });

// Get maximum items per page
const response = await client.people.getAll({ perPage: 100 });
```

### `page`

Page number (1-indexed).

```typescript
// Get first page
const page1 = await client.people.getAll({ page: 1 });

// Get second page
const page2 = await client.people.getAll({ page: 2 });
```

## Checking for More Pages

Always check `links.next` to determine if more pages exist:

```typescript
const response = await client.people.getAll({ perPage: 25 });

if (response.links?.next) {
  console.log('More pages available');
} else {
  console.log('Last page reached');
}
```

**Important**: Don't rely on `meta.total_pages` being present (it's optional).

## Pagination Patterns

### Pattern 1: Simple Loop

```typescript
async function getAllPeople(client: PcoClient) {
  const allPeople: PersonResource[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.people.getAll({ perPage: 25, page });
    allPeople.push(...response.data);
    hasMore = response.links?.next !== undefined && response.links?.next !== null;
    page++;
  }

  return allPeople;
}
```

### Pattern 2: With Progress Tracking

```typescript
async function getAllPeopleWithProgress(client: PcoClient, onProgress?: (page: number, total?: number) => void) {
  const allPeople: PersonResource[] = [];
  let page = 1;
  let hasMore = true;
  let totalPages: number | undefined;

  while (hasMore) {
    const response = await client.people.getAll({ perPage: 25, page });
    allPeople.push(...response.data);

    // Update total pages if available
    if (response.meta?.total_pages) {
      totalPages = response.meta.total_pages;
    }

    // Call progress callback
    if (onProgress) {
      onProgress(page, totalPages);
    }

    hasMore = response.links?.next !== undefined && response.links?.next !== null;
    page++;
  }

  return allPeople;
}

// Usage
const people = await getAllPeopleWithProgress(client, (page, total) => {
  console.log(`Progress: ${page}/${total || '?'} pages`);
});
```

### Pattern 3: Paginated Iterator

```typescript
class PaginatedIterator<T> {
  private client: PcoClient;
  private endpoint: string;
  private params: Record<string, any>;
  private currentPage = 1;
  private currentResponse: Paginated<T> | null = null;

  constructor(client: PcoClient, endpoint: string, params: Record<string, any> = {}) {
    this.client = client;
    this.endpoint = endpoint;
    this.params = params;
  }

  async next(): Promise<{ value: T[]; done: boolean }> {
    if (this.currentResponse && !this.currentResponse.links?.next) {
      return { value: [], done: true };
    }

    const response = await this.client.people.getAll({
      ...this.params,
      page: this.currentPage
    } as any);

    this.currentResponse = response;
    this.currentPage++;

    return {
      value: response.data,
      done: !response.links?.next
    };
  }
}

// Usage
const iterator = new PaginatedIterator(client, 'people', { perPage: 25 });
const page1 = await iterator.next();
const page2 = await iterator.next();
```

## Edge Cases

### Empty Results

```typescript
const response = await client.people.getAll({ perPage: 25 });

if (response.data.length === 0) {
  console.log('No people found');
}

// Check if truly empty (no more pages)
if (response.data.length === 0 && !response.links?.next) {
  console.log('No people exist');
}
```

### Single Page

```typescript
const response = await client.people.getAll({ perPage: 100 });

// If response fits in one page
if (!response.links?.next) {
  console.log('All data in single page');
}
```

### Rate Limiting

Pagination automatically respects rate limits:

```typescript
// Library handles rate limiting automatically
const allPeople = await client.people.getAllPages({ perPage: 25 });
// Automatically waits if rate limit reached
```

### Error Handling

```typescript
async function getAllPeopleSafely(client: PcoClient) {
  const allPeople: PersonResource[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await client.people.getAll({ perPage: 25, page });
      allPeople.push(...response.data);
      hasMore = response.links?.next !== undefined && response.links?.next !== null;
      page++;
    } catch (error) {
      if (error instanceof PcoError && error.category === ErrorCategory.RATE_LIMIT) {
        // Rate limited - wait and retry
        const delay = error.getRetryDelay();
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry same page
      }
      throw error; // Re-throw other errors
    }
  }

  return allPeople;
}
```

## Performance Tips

1. **Use larger page sizes** when possible (up to 100) to reduce API calls
2. **Use `getAllPages()`** for convenience, but be aware of memory usage
3. **Process incrementally** for very large datasets
4. **Monitor rate limits** using event system
5. **Cache field definitions** to reduce API calls

## Examples

### Example: Export All People

```typescript
async function exportAllPeople(client: PcoClient) {
  const allPeople = await client.people.getAllPages({
    perPage: 100,
    include: ['emails', 'phone_numbers', 'addresses']
  });

  // Export to CSV, JSON, etc.
  return exportToCSV(allPeople.data);
}
```

### Example: Process People in Batches

```typescript
async function processPeopleInBatches(client: PcoClient, batchSize: number) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.people.getAll({
      perPage: batchSize,
      page: page
    });

    // Process batch
    await processBatch(response.data);

    hasMore = response.links?.next !== undefined && response.links?.next !== null;
    page++;
  }
}
```

---

**Next**: See [Error Handling Guide](./error-handling.md) for error handling patterns.
