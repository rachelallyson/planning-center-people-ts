/**
 * v2.0.0 Event System and Monitoring
 */

import type {
    PcoEvent,
    EventHandler,
    EventType,
    EventEmitter
} from './types/events';

export class PcoEventEmitter implements EventEmitter {
    private handlers = new Map<EventType, Set<EventHandler>>();

    on<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType)!.add(handler as EventHandler);
    }

    off<T extends PcoEvent>(eventType: T['type'], handler: EventHandler<T>): void {
        const eventHandlers = this.handlers.get(eventType);
        if (eventHandlers) {
            eventHandlers.delete(handler as EventHandler);
            if (eventHandlers.size === 0) {
                this.handlers.delete(eventType);
            }
        }
    }

    emit<T extends PcoEvent>(event: T): void {
        const eventHandlers = this.handlers.get(event.type);
        if (eventHandlers) {
            for (const handler of eventHandlers) {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Error in event handler for ${event.type}:`, error);
                }
            }
        }
    }

    /** Remove all event handlers */
    removeAllListeners(eventType?: EventType): void {
        if (eventType) {
            this.handlers.delete(eventType);
        } else {
            this.handlers.clear();
        }
    }

    /** Get the number of listeners for an event type */
    listenerCount(eventType: EventType): number {
        return this.handlers.get(eventType)?.size || 0;
    }

    /** Get all registered event types */
    eventTypes(): EventType[] {
        return Array.from(this.handlers.keys());
    }
}

/**
 * Request ID generator for tracking requests
 */
export class RequestIdGenerator {
    private counter = 0;

    generate(): string {
        return `req_${Date.now()}_${++this.counter}`;
    }
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
    private metrics = new Map<string, {
        count: number;
        totalTime: number;
        minTime: number;
        maxTime: number;
        errors: number;
    }>();

    record(operation: string, duration: number, success: boolean = true): void {
        const existing = this.metrics.get(operation) || {
            count: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errors: 0,
        };

        existing.count++;
        existing.totalTime += duration;
        existing.minTime = Math.min(existing.minTime, duration);
        existing.maxTime = Math.max(existing.maxTime, duration);

        if (!success) {
            existing.errors++;
        }

        this.metrics.set(operation, existing);
    }

    getMetrics(): Record<string, {
        count: number;
        averageTime: number;
        minTime: number;
        maxTime: number;
        errorRate: number;
    }> {
        const result: Record<string, any> = {};

        for (const [operation, metrics] of this.metrics) {
            result[operation] = {
                count: metrics.count,
                averageTime: metrics.totalTime / metrics.count,
                minTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
                maxTime: metrics.maxTime,
                errorRate: metrics.errors / metrics.count,
            };
        }

        return result;
    }

    reset(): void {
        this.metrics.clear();
    }
}

/**
 * Rate limit tracker
 */
export class RateLimitTracker {
    private limits = new Map<string, {
        limit: number;
        remaining: number;
        resetTime: number;
    }>();

    update(endpoint: string, limit: number, remaining: number, resetTime: number): void {
        this.limits.set(endpoint, { limit, remaining, resetTime });
    }

    getRemaining(endpoint: string): number {
        const limit = this.limits.get(endpoint);
        return limit?.remaining || 0;
    }

    getResetTime(endpoint: string): number {
        const limit = this.limits.get(endpoint);
        return limit?.resetTime || 0;
    }

    isRateLimited(endpoint: string): boolean {
        const limit = this.limits.get(endpoint);
        return limit ? limit.remaining <= 0 : false;
    }

    getAllLimits(): Record<string, { limit: number; remaining: number; resetTime: number }> {
        const result: Record<string, any> = {};
        for (const [endpoint, limit] of this.limits) {
            result[endpoint] = limit;
        }
        return result;
    }
}
