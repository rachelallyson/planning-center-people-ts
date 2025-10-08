// Export all JSON:API types
export * from './json-api';

// Export all People-specific types
export * from './people';

// Re-export commonly used types for convenience
export type {
  Paginated,
  Relationship,
  ResourceIdentifier,
  ResourceObject,
} from './json-api';
export type {
  AddressAttributes,
  AddressesList,
  AddressResource,
  AddressSingle,
  EmailAttributes,
  EmailResource,
  EmailSingle,
  EmailsList,
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
} from './people';
