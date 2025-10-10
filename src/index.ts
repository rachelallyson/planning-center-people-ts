// ===== v2.0.0 Main Exports =====

// Main client class
export { PcoClient } from './client';

// Client manager for caching and lifecycle management
export { PcoClientManager } from './client-manager';

// Configuration types
export type { PcoClientConfig } from './types/client';

// Event system
export type { PcoEvent, EventHandler, EventType } from './types/events';

// Batch operations
export type { BatchOperation, BatchResult, BatchOptions, BatchSummary } from './types/batch';

// Core types
export type {
  Paginated,
  Relationship,
  ResourceIdentifier,
  ResourceObject,
} from './types';

// People types
export type {
  PersonResource,
  PersonAttributes,
  PersonSingle,
  PeopleList,
  EmailResource,
  EmailAttributes,
  PhoneNumberResource,
  PhoneNumberAttributes,
  AddressResource,
  AddressAttributes,
  SocialProfileResource,
  SocialProfileAttributes,
} from './types';

// Field types
export type {
  FieldDefinitionResource,
  FieldDefinitionAttributes,
  FieldDatumResource,
  FieldDatumAttributes,
  FieldOptionResource,
  FieldOptionAttributes,
  TabResource,
  TabAttributes,
} from './types';

// Workflow types
export type {
  WorkflowResource,
  WorkflowAttributes,
  WorkflowCardResource,
  WorkflowCardAttributes,
  WorkflowCardNoteResource,
  WorkflowCardNoteAttributes,
} from './types';

// Other resource types
export type {
  HouseholdResource,
  HouseholdAttributes,
  NoteResource,
  NoteAttributes,
  ListResource,
  ListAttributes,
  OrganizationResource,
  OrganizationAttributes,
} from './types';

// ===== v1.x Compatibility Exports (Deprecated) =====

// Export all types for backward compatibility
export * from './types';

// Export core client functionality (deprecated)
export type { PcoClientConfig as PcoClientConfigV1, PcoClientState } from './core';
export {
  createPcoClient,
  del,
  getAllPages,
  getList,
  getRateLimitInfo,
  getSingle,
  patch,
  post,
} from './core';

// Export authentication utilities (deprecated)
export type { TokenResponse, TokenRefreshCallback, TokenRefreshFailureCallback } from './auth';
export {
  attemptTokenRefresh,
  hasRefreshTokenCapability,
  refreshAccessToken,
  updateClientTokens,
} from './auth';

// Export API error
export { PcoApiError } from './api-error';

// Export rate limiter
export type { RateLimitHeaders, RateLimitInfo } from './rate-limiter';
export { PcoRateLimiter } from './rate-limiter';

// Export enhanced error handling
export type { ErrorContext } from './error-handling';
export {
  ErrorCategory,
  ErrorSeverity,
  handleNetworkError,
  handleTimeoutError,
  handleValidationError,
  PcoError,
  retryWithBackoff,
  shouldNotRetry,
  withErrorBoundary,
} from './error-handling';

// Export People-specific functions (deprecated)
export {
  createFieldDefinition,
  createFieldOption,
  createPerson,
  createPersonAddress,
  createPersonEmail,
  createPersonFieldData,
  createPersonPhoneNumber,
  createPersonSocialProfile,
  createWorkflowCard,
  createWorkflowCardNote,
  deleteFieldDefinition,
  deletePerson,
  deletePersonFieldData,
  deleteSocialProfile,
  getFieldDefinitions,
  getFieldOptions,
  getHousehold,
  getHouseholds,
  getTabs,
  getListById,
  getListCategories,
  getLists,
  getNote,
  getNoteCategories,
  getNotes,
  getOrganization,
  getPeople,
  getPerson,
  getPersonAddresses,
  getPersonEmails,
  getPersonFieldData,
  getPersonPhoneNumbers,
  getPersonSocialProfiles,
  getWorkflow,
  getWorkflowCardNotes,
  getWorkflowCards,
  getWorkflows,
  updatePerson,
  updatePersonAddress,
} from './people';

// ===== Enhanced Error Handling =====
export {
  attemptRecovery,
  CircuitBreaker,
  classifyError,
  createErrorReport,
  DEFAULT_RETRY_CONFIG,
  executeBulkOperation,
  retryWithExponentialBackoff,
  TIMEOUT_CONFIG,
  withTimeout,
} from './error-scenarios';

// ===== Helper Functions =====
export {
  buildQueryParams,
  calculateAge,
  createPersonWithContact,
  createWorkflowCardWithNote,
  exportAllPeopleData,
  extractFileUrl,
  formatDate,
  formatPersonName,
  getCompletePersonProfile,
  getFileExtension,
  getFilename,
  getListsWithCategories,
  getOrganizationInfo,
  getPeopleByHousehold,
  getPersonWorkflowCardsWithNotes,
  getPrimaryContact,
  isFileUpload,
  isFileUrl,
  isValidEmail,
  isValidPhone,
  processFileValue,
  searchPeople,
  validatePersonData,
} from './helpers';

// ===== Performance Optimization =====
export {
  AdaptiveRateLimiter,
  ApiCache,
  batchFetchPersonDetails,
  fetchAllPages,
  getCachedPeople,
  monitorPerformance,
  PerformanceMonitor,
  processInBatches,
  processLargeDataset,
  streamPeopleData,
} from './performance';

// ===== Testing Utilities =====
export {
  MockPcoClient,
  MockResponseBuilder,
  RequestRecorder,
  createMockClient,
  createRecordingClient,
  createTestClient,
  createErrorMockClient,
  createSlowMockClient,
} from './testing';
export type { MockClientConfig, RecordingConfig } from './testing';
