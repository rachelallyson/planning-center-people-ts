/**
 * v2.0.0 Request/Response Recorder
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RecordingConfig, RecordedRequest, RecordedSession } from './types';

export class RequestRecorder {
    private config: RecordingConfig;
    private requests: RecordedRequest[] = [];
    private isRecording: boolean = false;

    constructor(config: RecordingConfig) {
        this.config = config;
        this.ensureRecordDirectory();
    }

    /**
     * Start recording requests
     */
    startRecording(): void {
        this.isRecording = true;
        this.requests = [];
    }

    /**
     * Stop recording and save to file
     */
    stopRecording(): void {
        this.isRecording = false;
        this.saveSession();
    }

    /**
     * Record a request/response pair
     */
    recordRequest(
        endpoint: string,
        method: string,
        params: Record<string, any> | undefined,
        data: any,
        response: any
    ): void {
        if (!this.isRecording) return;

        // Apply filter if provided
        if (this.config.filter && !this.config.filter(endpoint, method)) {
            return;
        }

        const request: RecordedRequest = {
            endpoint,
            method,
            params,
            data,
            response: this.config.transform ? this.config.transform(response) : response,
            timestamp: new Date().toISOString(),
        };

        this.requests.push(request);
    }

    /**
     * Replay a recorded request
     */
    replayRequest(
        endpoint: string,
        method: string,
        params: Record<string, any> | undefined,
        data: any
    ): any | null {
        const session = this.loadSession();
        if (!session) return null;

        const request = session.requests.find(req =>
            req.endpoint === endpoint &&
            req.method === method &&
            this.compareParams(req.params, params) &&
            this.compareData(req.data, data)
        );

        return request ? request.response : null;
    }

    /**
     * Check if we should record or replay
     */
    shouldRecord(endpoint: string, method: string): boolean {
        if (this.config.mode === 'record') return true;
        if (this.config.mode === 'replay') return false;

        // Auto mode: record if no existing session, otherwise replay
        const session = this.loadSession();
        return !session;
    }

    /**
     * Get all recorded requests
     */
    getRequests(): RecordedRequest[] {
        return [...this.requests];
    }

    /**
     * Clear recorded requests
     */
    clearRequests(): void {
        this.requests = [];
    }

    /**
     * Save the current session to file
     */
    private saveSession(): void {
        const session: RecordedSession = {
            requests: this.requests,
            metadata: {
                recordedAt: new Date().toISOString(),
                version: '2.0.0',
                config: {} as any, // Would be filled with actual config
            },
        };

        try {
            fs.writeFileSync(this.config.recordPath, JSON.stringify(session, null, 2));
        } catch (error) {
            console.error('Failed to save recording session:', error);
        }
    }

    /**
     * Load a session from file
     */
    private loadSession(): RecordedSession | null {
        try {
            if (!fs.existsSync(this.config.recordPath)) {
                return null;
            }

            const content = fs.readFileSync(this.config.recordPath, 'utf-8');
            return JSON.parse(content) as RecordedSession;
        } catch (error) {
            console.error('Failed to load recording session:', error);
            return null;
        }
    }

    /**
     * Ensure the record directory exists
     */
    private ensureRecordDirectory(): void {
        const dir = path.dirname(this.config.recordPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Compare two parameter objects
     */
    private compareParams(params1: Record<string, any> | undefined, params2: Record<string, any> | undefined): boolean {
        if (!params1 && !params2) return true;
        if (!params1 || !params2) return false;

        const keys1 = Object.keys(params1).sort();
        const keys2 = Object.keys(params2).sort();

        if (keys1.length !== keys2.length) return false;

        for (let i = 0; i < keys1.length; i++) {
            if (keys1[i] !== keys2[i]) return false;
            if (params1[keys1[i]] !== params2[keys2[i]]) return false;
        }

        return true;
    }

    /**
     * Compare two data objects
     */
    private compareData(data1: any, data2: any): boolean {
        if (!data1 && !data2) return true;
        if (!data1 || !data2) return false;

        return JSON.stringify(data1) === JSON.stringify(data2);
    }
}
