import type { RateLimitHeaders } from './rate-limiter';
import type { ErrorObject as JsonApiError } from './types';

// ===== PCO API Error =====
export class PcoApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly errors: JsonApiError[];
  public readonly rateLimitHeaders?: RateLimitHeaders;

  constructor(
    message: string,
    status: number,
    statusText: string,
    errors: JsonApiError[],
    rateLimitHeaders?: RateLimitHeaders
  ) {
    super(message);
    this.name = 'PcoApiError';
    this.status = status;
    this.statusText = statusText;
    this.errors = errors;
    this.rateLimitHeaders = rateLimitHeaders;
  }

  static fromFetchError(response: Response, data?: unknown): PcoApiError {
    const status = response.status;
    const statusText = response.statusText;

    const apiErrors: JsonApiError[] = Array.isArray(
      (data as { errors?: unknown })?.errors
    )
      ? ((data as { errors?: unknown }).errors as JsonApiError[]) || []
      : [];

    const rateLimitHeaders: RateLimitHeaders = {
      'Retry-After': response.headers.get('retry-after') ?? undefined,
      'X-PCO-API-Request-Rate-Count':
        response.headers.get('x-pco-api-request-rate-count') ?? undefined,
      'X-PCO-API-Request-Rate-Limit':
        response.headers.get('x-pco-api-request-rate-limit') ?? undefined,
      'X-PCO-API-Request-Rate-Period':
        response.headers.get('x-pco-api-request-rate-period') ?? undefined,
    };

    const message =
      apiErrors.length > 0
        ? apiErrors.map(e => e.detail ?? e.title ?? 'Unknown error').join('; ')
        : statusText;

    return new PcoApiError(
      message,
      status,
      statusText,
      apiErrors,
      rateLimitHeaders
    );
  }
}
