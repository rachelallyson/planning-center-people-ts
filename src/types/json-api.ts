/**
 * Minimal JSON:API 1.0 type definitions aligned with PCO responses
 */

// ===== JSON values and meta =====

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

export type Meta = Record<string, JsonValue>;

// ===== Links =====

export interface LinkObject {
  href: string;
  meta?: Meta;
}

export type Link = string | LinkObject;
export type Links = Record<string, Link>;

export interface PaginationLinks {
  first?: Link | null;
  last?: Link | null;
  prev?: Link | null;
  next?: Link | null;
}

export type TopLevelLinks = Links & PaginationLinks;

export interface TopLevelJsonApi {
  version?: string;
  meta?: Meta;
}

// ===== Core resource primitives =====

/**
 * A ResourceIdentifier identifies an individual resource by type string and id.
 */
export interface ResourceIdentifier<TType extends string = string> {
  type: TType;
  id: string;
  meta?: Meta;
}

/**
 * Relationships contain only resource identifiers (not full resources).
 */
export interface Relationship {
  data?: ResourceIdentifier | ResourceIdentifier[] | null;
  links?: Links;
  meta?: Meta;
}

/**
 * Optional helpers to type identifier relationships
 */
export type ToOne<TType extends string> = Omit<Relationship, 'data'> & {
  data?: ResourceIdentifier<TType> | null;
};

export type ToMany<TType extends string> = Omit<Relationship, 'data'> & {
  data?: ResourceIdentifier<TType>[];
};

/**
 * Attributes describing a Resource Object
 */
export type Attributes = Record<
  string,
  string | number | boolean | object | undefined | null
>;

/**
 * A representation of a single resource.
 */
export interface ResourceObject<
  TType extends string = string,
  TAttrs extends Attributes = Attributes,
  TRelMap = Record<string, Relationship>,
> {
  type: TType;
  id: string;
  attributes?: TAttrs;
  relationships?: TRelMap;
  links?: Links;
  meta?: Meta;
}

// ===== Documents =====

export interface JsonApiBase {
  links?: TopLevelLinks;
  jsonapi?: TopLevelJsonApi;
  meta?: Meta;
}

export interface ErrorObject {
  id?: string;
  links?: { about?: string };
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: { pointer?: string; parameter?: string; header?: string };
  meta?: Meta;
}

export interface ErrorDocument extends JsonApiBase {
  errors: ErrorObject[];
  data?: never;
  included?: never;
}

export interface DataDocumentSingle<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
> extends JsonApiBase {
  data: TRes | null;
  included?: TIncluded[];
  errors?: never;
}

export interface DataDocumentMany<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
> extends JsonApiBase {
  data: TRes[];
  included?: TIncluded[];
  errors?: never;
}

export type JsonApiDocument<
  TRes extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
> =
  | DataDocumentSingle<TRes, TIncluded>
  | DataDocumentMany<TRes, TIncluded>
  | ErrorDocument;

// ===== Helpers for common response shapes =====

export type Paginated<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
> = DataDocumentMany<TRes, TIncluded> & {
  links: TopLevelLinks & { next?: string | null; prev?: string | null };
};

/**
 * Alias for single-resource responses or error documents, for convenience.
 */
export type Response<
  TRes extends ResourceObject<string, any, any>,
  TIncluded extends ResourceObject<string, any, any> = ResourceObject<
    string,
    any,
    any
  >,
> = DataDocumentSingle<TRes, TIncluded> | ErrorDocument;
