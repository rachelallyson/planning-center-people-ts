/**
 * Planning Center People API Types
 * Based on JSON:API 1.0 specification
 */

import {
  Attributes,
  Paginated,
  Relationship,
  ResourceObject,
  Response,
} from './json-api';

// ===== Person Resource =====

export interface PersonAttributes extends Attributes {
  first_name?: string;
  last_name?: string;
  given_name?: string;
  middle_name?: string;
  nickname?: string;
  birthdate?: string;
  anniversary?: string;
  gender?: string;
  grade?: string;
  child?: boolean;
  status?: string;
  medical_notes?: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
  family_name?: string;
  job_title?: string;
  employer?: string;
  school?: string;
  graduation_year?: string;
  avatar?: string;
  site_administrator?: boolean;
  accounting_administrator?: boolean;
  people_permissions?: string | null;
  // Additional attributes seen in live responses
  directory_status?: string | null;
  login_identifier?: string | null;
  membership?: string | null;
  remote_id?: string | null;
  demographic_avatar_url?: string | null;
  inactivated_at?: string | null;
  resource_permission_flags?: Record<string, boolean>;
}

export interface PersonRelationships {
  emails?: Relationship;
  phone_numbers?: Relationship;
  primary_campus?: Relationship;
  gender?: Relationship;
}

export interface PersonResource
  extends ResourceObject<'Person', PersonAttributes, PersonRelationships> { }

export type PeopleList = Paginated<PersonResource, PeopleIncluded>;
export type PersonSingle = Response<PersonResource>;

// ===== Email Resource =====

export interface EmailAttributes extends Attributes {
  address?: string;
  location?: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
  blocked?: boolean;
}

export interface EmailRelationships {
  person?: Relationship;
}

export interface EmailResource
  extends ResourceObject<'Email', EmailAttributes, EmailRelationships> { }

export type EmailsList = Paginated<EmailResource>;
export type EmailSingle = Response<EmailResource>;

// ===== Phone Number Resource =====

export interface PhoneNumberAttributes extends Attributes {
  number?: string;
  location?: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PhoneNumberRelationships {
  person?: Relationship;
}

export interface PhoneNumberResource
  extends ResourceObject<
    'PhoneNumber',
    PhoneNumberAttributes,
    PhoneNumberRelationships
  > { }

export type PhoneNumbersList = Paginated<PhoneNumberResource>;
export type PhoneNumberSingle = Response<PhoneNumberResource>;

// ===== Address Resource =====

export interface AddressAttributes extends Attributes {
  street_line_1?: string;
  street_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country_code?: string;
  country_name?: string;
  location?: string;
  primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressRelationships {
  person?: Relationship;
  household?: Relationship;
}

export interface AddressResource
  extends ResourceObject<'Address', AddressAttributes, AddressRelationships> { }

export type AddressesList = Paginated<AddressResource>;
export type AddressSingle = Response<AddressResource>;

// ===== Household Resource =====

export interface HouseholdAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HouseholdRelationships {
  people?: Relationship;
  primary_contact?: Relationship;
}

export interface HouseholdResource
  extends ResourceObject<
    'Household',
    HouseholdAttributes,
    HouseholdRelationships
  > { }

export type HouseholdsList = Paginated<HouseholdResource>;
export type HouseholdSingle = Response<HouseholdResource>;

// ===== Social Profile Resource =====

export interface SocialProfileAttributes extends Attributes {
  site?: string;
  url?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SocialProfileRelationships {
  // According to API docs, SocialProfile has no relationships
}

export interface SocialProfileResource
  extends ResourceObject<
    'SocialProfile',
    SocialProfileAttributes,
    SocialProfileRelationships
  > { }

export type SocialProfilesList = Paginated<SocialProfileResource>;
export type SocialProfileSingle = Response<SocialProfileResource>;

// ===== Field Definition Resource =====

export interface FieldDefinitionAttributes extends Attributes {
  config: string | Record<string, any> | null;
  data_type: string;
  deleted_at: string | null | false; // Can be date string, null, or boolean false
  name: string;
  sequence: number;
  slug: string;
  tab_id: number;
}

export interface FieldDefinitionRelationships {
  tab?: Relationship;
}

export interface FieldDefinitionResource
  extends ResourceObject<
    'FieldDefinition',
    FieldDefinitionAttributes,
    FieldDefinitionRelationships
  > { }

export type FieldDefinitionsList = Paginated<FieldDefinitionResource>;
export type FieldDefinitionSingle = Response<FieldDefinitionResource>;

// ===== Tab Resource =====

export interface TabAttributes extends Attributes {
  name?: string;
  sequence?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface TabRelationships {
  // Tabs may have relationships to field definitions
  field_definitions?: Relationship;
}

export interface TabResource
  extends ResourceObject<
    'Tab',
    TabAttributes,
    TabRelationships
  > { }

export type TabsList = Paginated<TabResource>;
export type TabSingle = Response<TabResource>;

// ===== Field Option Resource =====

export interface FieldOptionAttributes extends Attributes {
  value: string;
  sequence: string | number;
}

export interface FieldOptionRelationships {
  field_definition?: Relationship;
}

export interface FieldOptionResource
  extends ResourceObject<
    'FieldOption',
    FieldOptionAttributes,
    FieldOptionRelationships
  > { }

export type FieldOptionsList = Paginated<FieldOptionResource>;
export type FieldOptionSingle = Response<FieldOptionResource>;

// ===== Field Datum Resource (aka field_data) =====

export interface FieldDatumAttributes extends Attributes {
  value?: string | null;
  file?: {
    url?: string | null;
    // Additional file metadata that may be present
    [key: string]: any;
  } | null;
  file_content_type?: string | null;
  file_name?: string | null;
  file_size?: string | number | null;

}

export interface FieldDatumRelationships {
  field_definition?: Relationship;
  field_option?: Relationship;
  // The API uses a polymorphic "customizable" relationship pointing to Person
  customizable?: Relationship;
}

export interface FieldDatumResource
  extends ResourceObject<
    'FieldDatum',
    FieldDatumAttributes,
    FieldDatumRelationships
  > { }

export type FieldDataList = Paginated<FieldDatumResource>;
export type FieldDataSingle = Response<FieldDatumResource>;

// ===== List Resource =====

export interface ListAttributes extends Attributes {
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}


export interface ListResource
  extends ResourceObject<'List', ListAttributes, {}> { }

export type ListsList = Paginated<ListResource>;
export type ListSingle = Response<ListResource>;

// ===== List Category Resource =====

export interface ListCategoryAttributes extends Attributes {
  name?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface ListCategoryRelationships {
  organization?: Relationship;
}

export interface ListCategoryResource
  extends ResourceObject<
    'ListCategory',
    ListCategoryAttributes,
    ListCategoryRelationships
  > { }

export type ListCategoriesList = Paginated<ListCategoryResource>;
export type ListCategorySingle = Response<ListCategoryResource>;

// ===== List Share Resource =====

export interface ListShareAttributes extends Attributes {
  permission?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListShareRelationships {
  list?: Relationship;
  person?: Relationship;
}

export interface ListShareResource
  extends ResourceObject<
    'ListShare',
    ListShareAttributes,
    ListShareRelationships
  > { }

export type ListSharesList = Paginated<ListShareResource>;
export type ListShareSingle = Response<ListShareResource>;

// ===== List Star Resource =====

export interface ListStarAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface ListStarRelationships {
  list?: Relationship;
  person?: Relationship;
}

export interface ListStarResource
  extends ResourceObject<
    'ListStar',
    ListStarAttributes,
    ListStarRelationships
  > { }

export type ListStarsList = Paginated<ListStarResource>;
export type ListStarSingle = Response<ListStarResource>;

// ===== Note Resource =====

export interface NoteAttributes extends Attributes {
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteRelationships {
  person?: Relationship;
  note_category?: Relationship;
  organization?: Relationship;
  created_by?: Relationship;
}

export interface NoteResource
  extends ResourceObject<'Note', NoteAttributes, NoteRelationships> { }

export type NotesList = Paginated<NoteResource>;
export type NoteSingle = Response<NoteResource>;

// ===== Note Category Resource =====

export interface NoteCategoryAttributes extends Attributes {
  name: string;
  locked: boolean;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoteCategoryRelationships {
  organization?: Relationship;
  shares?: Relationship;
  subscriptions?: Relationship;
}

export interface NoteCategoryResource
  extends ResourceObject<
    'NoteCategory',
    NoteCategoryAttributes,
    NoteCategoryRelationships
  > { }

export type NoteCategoriesList = Paginated<NoteCategoryResource>;
export type NoteCategorySingle = Response<NoteCategoryResource>;

// ===== Note Category Share Resource =====

export interface NoteCategoryShareAttributes extends Attributes {
  permission?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteCategoryShareRelationships {
  category?: Relationship;
  person?: Relationship;
}

export interface NoteCategoryShareResource
  extends ResourceObject<
    'NoteCategoryShare',
    NoteCategoryShareAttributes,
    NoteCategoryShareRelationships
  > { }

export type NoteCategorySharesList = Paginated<NoteCategoryShareResource>;
export type NoteCategoryShareSingle = Response<NoteCategoryShareResource>;

// ===== Note Category Subscription Resource =====

export interface NoteCategorySubscriptionAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface NoteCategorySubscriptionRelationships {
  category?: Relationship;
  person?: Relationship;
}

export interface NoteCategorySubscriptionResource
  extends ResourceObject<
    'NoteCategorySubscription',
    NoteCategorySubscriptionAttributes,
    NoteCategorySubscriptionRelationships
  > { }

export type NoteCategorySubscriptionsList =
  Paginated<NoteCategorySubscriptionResource>;
export type NoteCategorySubscriptionSingle =
  Response<NoteCategorySubscriptionResource>;

// ===== Workflow Resource =====

export interface WorkflowAttributes extends Attributes {
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowRelationships {
  workflow_category?: Relationship;
  campus?: Relationship;
}

export interface WorkflowResource
  extends ResourceObject<
    'Workflow',
    WorkflowAttributes,
    WorkflowRelationships
  > { }

export type WorkflowsList = Paginated<WorkflowResource>;
export type WorkflowSingle = Response<WorkflowResource>;

// ===== Workflow Card Resource =====

export interface WorkflowCardAttributes extends Attributes {
  // Common fields
  title?: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Fields observed/used by integration and docs
  completed_at?: string | null;
  removed_at?: string | null;
  // Fields discovered in validation
  snooze_until?: string | null;
  overdue_at?: string | null;
  stage_id?: string;
}

export interface WorkflowCardRelationships {
  workflow?: Relationship;
  person?: Relationship;
}

export interface WorkflowCardResource
  extends ResourceObject<
    'WorkflowCard',
    WorkflowCardAttributes,
    WorkflowCardRelationships
  > { }

export type WorkflowCardsList = Paginated<WorkflowCardResource>;
export type WorkflowCardSingle = Response<WorkflowCardResource>;

// ===== Workflow Card Note Resource =====

export interface WorkflowCardNoteAttributes extends Attributes {
  note?: string;
}



export interface WorkflowCardNoteResource
  extends ResourceObject<
    'WorkflowCardNote',
    WorkflowCardNoteAttributes,
    {}> { }

export type WorkflowCardNotesList = Paginated<WorkflowCardNoteResource>;
export type WorkflowCardNoteSingle = Response<WorkflowCardNoteResource>;

// ===== Organization Resource =====

export interface OrganizationAttributes extends Attributes {
  avatar_url?: string | null;
  church_center_subdomain?: string;
  contact_website?: string | null;
  country_code?: string;
  created_at?: string;
  date_format?: string;
  name?: string;
  time_zone?: string;
}

export interface OrganizationRelationships {
  people?: Relationship;
  statistics?: Relationship;
}

export interface OrganizationResource
  extends ResourceObject<
    'Organization',
    OrganizationAttributes,
    OrganizationRelationships
  > { }

export type OrganizationsList = Paginated<OrganizationResource>;
export type OrganizationSingle = Response<OrganizationResource>;

// ===== Organization Statistic Resource =====

export interface OrganizationStatisticAttributes extends Attributes {
  name?: string;
  value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationStatisticRelationships {
  organization?: Relationship;
}

export interface OrganizationStatisticResource
  extends ResourceObject<
    'OrganizationStatistic',
    OrganizationStatisticAttributes,
    OrganizationStatisticRelationships
  > { }

export type OrganizationStatisticsList =
  Paginated<OrganizationStatisticResource>;
export type OrganizationStatisticSingle =
  Response<OrganizationStatisticResource>;

// ===== Included union for People =====

export type PeopleIncluded =
  | EmailResource
  | AddressResource
  | PhoneNumberResource
  | HouseholdResource
  | SocialProfileResource
  | FieldDatumResource
  | TabResource;
