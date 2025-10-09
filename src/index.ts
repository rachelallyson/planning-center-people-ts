// Export all types
export * from './types';

// Export core client functionality
export type { PcoClientConfig, PcoClientState } from './core';
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

// Export authentication utilities
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

// Export People-specific functions
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

// Re-export commonly used types for convenience
export type {
  Paginated,
  Relationship,
  ResourceIdentifier,
  ResourceObject,
} from './types';
export type {
  AddressAttributes,
  AddressesList,
  AddressResource,
  AddressSingle,
  EmailAttributes,
  EmailResource,
  EmailSingle,
  EmailsList,
  FieldDataList,
  FieldDataSingle,
  FieldDatumAttributes,
  FieldDatumRelationships,
  FieldDatumResource,
  FieldDefinitionAttributes,
  FieldDefinitionResource,
  FieldDefinitionSingle,
  FieldDefinitionsList,
  FieldOptionAttributes,
  FieldOptionResource,
  FieldOptionSingle,
  FieldOptionsList,
  HouseholdAttributes,
  HouseholdResource,
  HouseholdSingle,
  HouseholdsList,
  // New types for additional resources
  ListAttributes,
  ListCategoriesList,
  ListCategoryAttributes,
  ListCategoryResource,
  ListCategorySingle,
  ListResource,
  ListSingle,
  ListsList,
  NoteAttributes,
  NoteCategoriesList,
  NoteCategoryAttributes,
  NoteCategoryResource,
  NoteCategorySingle,
  NoteResource,
  NoteSingle,
  NotesList,
  OrganizationAttributes,
  OrganizationResource,
  OrganizationSingle,
  // Document types
  PeopleList,
  PersonAttributes,
  PersonRelationships,
  PersonResource,
  PersonSingle,
  PhoneNumberAttributes,
  PhoneNumberResource,
  PhoneNumberSingle,
  PhoneNumbersList,
  SocialProfileAttributes,
  SocialProfileResource,
  SocialProfileSingle,
  SocialProfilesList,
  WorkflowAttributes,
  WorkflowCardAttributes,
  WorkflowCardNoteAttributes,
  WorkflowCardNoteResource,
  WorkflowCardNoteSingle,
  WorkflowCardNotesList,
  WorkflowCardRelationships,
  WorkflowCardResource,
  WorkflowCardSingle,
  WorkflowCardsList,
  WorkflowResource,
  WorkflowSingle,
  WorkflowsList,
} from './types';

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
