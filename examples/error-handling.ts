import {
    createPcoClient,
    getPeople,
    getPerson,
    createPerson,
    PcoError,
    ErrorCategory,
    ErrorSeverity,
    retryWithBackoff,
    withErrorBoundary,
    type ErrorContext,
} from '../src';

async function errorHandlingExample() {
    // Create a client with enhanced error handling configuration
    const client = createPcoClient({
        accessToken: 'your-token-here',
        timeout: 30000, // 30 second timeout
        retry: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            onRetry: (error: PcoError, attempt: number) => {
                console.log(`Retry attempt ${attempt} for ${error.context.endpoint}:`, {
                    category: error.category,
                    severity: error.severity,
                    retryable: error.retryable,
                });
            },
        },
    });

    try {
        // Example 1: Basic error handling with context
        const people = await getPeople(client, { per_page: 10 }, {
            metadata: { operation: 'fetch_people_list' },
        });
        console.log(`Found ${people.data.length} people`);

    } catch (error) {
        if (error instanceof PcoError) {
            console.error('PCO Error Details:', {
                message: error.message,
                status: error.status,
                category: error.category,
                severity: error.severity,
                retryable: error.retryable,
                context: error.context,
                errors: error.errors,
            });

            // Handle different error categories
            switch (error.category) {
                case ErrorCategory.AUTHENTICATION:
                    console.error('Authentication failed - check your token');
                    break;
                case ErrorCategory.RATE_LIMIT:
                    console.error('Rate limited - retry after:', error.getRetryDelay(), 'ms');
                    break;
                case ErrorCategory.VALIDATION:
                    console.error('Validation error - check your request data');
                    break;
                case ErrorCategory.NETWORK:
                    console.error('Network error - check your connection');
                    break;
                default:
                    console.error('Unknown error occurred');
            }
        } else {
            console.error('Unexpected error:', error);
        }
    }

    try {
        // Example 2: Custom retry logic
        const result = await retryWithBackoff(
            () => getPerson(client, 'non-existent-id'),
            {
                maxRetries: 2,
                baseDelay: 500,
                context: {
                    endpoint: '/people/non-existent-id',
                    method: 'GET',
                    metadata: { custom_retry: true },
                },
                onRetry: (error, attempt) => {
                    console.log(`Custom retry ${attempt} for non-existent person`);
                },
            }
        );
        console.log('Result:', result);

    } catch (error) {
        if (error instanceof PcoError) {
            console.error('Custom retry failed:', error.getErrorSummary());
        }
    }

    try {
        // Example 3: Error boundary wrapper
        const result = await withErrorBoundary(
            () => createPerson(client, {
                first_name: 'John',
                // Missing required fields to trigger validation error
            }),
            {
                endpoint: '/people',
                method: 'POST',
                metadata: { operation: 'create_person_with_error_boundary' },
            }
        );
        console.log('Created person:', result);

    } catch (error) {
        if (error instanceof PcoError) {
            console.error('Error boundary caught:', {
                category: error.category,
                severity: error.severity,
                context: error.context,
            });
        }
    }

    try {
        // Example 4: Handling specific error types
        const person = await getPerson(client, 'valid-person-id');

        // This will likely fail with a 404
        const invalidPerson = await getPerson(client, 'invalid-id');

    } catch (error) {
        if (error instanceof PcoError) {
            if (error.status === 404) {
                console.log('Person not found - this is expected for invalid IDs');
            } else if (error.status === 401) {
                console.error('Authentication required');
            } else if (error.status === 429) {
                console.error('Rate limited - wait before retrying');
            } else {
                console.error('Unexpected PCO error:', error.message);
            }
        }
    }

    // Example 5: Batch operations with error handling
    const personIds = ['id1', 'id2', 'id3', 'id4'];
    const results = [];

    for (const personId of personIds) {
        try {
            const person = await getPerson(client, personId, undefined, {
                personId,
                metadata: { batch_operation: true },
            });
            results.push({ personId, success: true, data: person });
        } catch (error) {
            if (error instanceof PcoError) {
                results.push({
                    personId,
                    success: false,
                    error: error.getErrorSummary()
                });
            } else {
                results.push({
                    personId,
                    success: false,
                    error: { message: 'Unknown error' }
                });
            }
        }
    }

    console.log('Batch operation results:', results);
}

// Run the example
errorHandlingExample().catch(console.error);
