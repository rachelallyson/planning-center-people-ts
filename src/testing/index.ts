/**
 * v2.0.0 Testing Utilities
 */

// Export simplified versions that work without complex type issues
export { SimpleMockResponseBuilder as MockResponseBuilder } from './simple-builders';
export {
    SimpleMockPcoClient as MockPcoClient,
    createSimpleMockClient as createMockClient,
    createTestClient,
    createErrorMockClient,
    createSlowMockClient
} from './simple-factories';
export type { SimpleMockClientConfig as MockClientConfig } from './simple-factories';

// Export recorder (simplified)
export { RequestRecorder } from './recorder';
export type { RecordingConfig } from './types';

// Export createRecordingClient (simplified)
export function createRecordingClient(config: any, recordingConfig: any): any {
    // Simplified implementation
    return new (require('./simple-factories').SimpleMockPcoClient)(config);
}
