// pco-jsonapi.ts

// ===== JSON:API Primitives =====
export type JsonValue =
    | string | number | boolean | null
    | { [k: string]: JsonValue }
    | JsonValue[];

export interface JsonApiDocumentBase {
    jsonapi?: { version?: string; meta?: Record<string, JsonValue> };
    links?: TopLevelLinks;
    meta?: Record<string, JsonValue>;
}

export interface TopLevelLinks {
    self?: string;
    related?: string;
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
    [k: string]: string | null | undefined;
}

export interface ErrorObject {
    id?: string;
    links?: { about?: string };
    status?: string;    // HTTP status code as string
    code?: string;      // application-specific error code
    title?: string;
    detail?: string;
    source?: { pointer?: string; parameter?: string; header?: string };
    meta?: Record<string, JsonValue>;
}

export interface ResourceIdentifier {
    type: string;
    id: string;
    meta?: Record<string, JsonValue>;
}

export interface RelationshipLinks {
    self?: string;
    related?: string;
}

export interface Relationship<TRel extends ResourceIdentifier | ResourceIdentifier[] | null = ResourceIdentifier | ResourceIdentifier[] | null> {
    links?: RelationshipLinks;
    data?: TRel;
    meta?: Record<string, JsonValue>;
}

export interface ResourceObject<
    TType extends string = string,
    TAttrs extends Record<string, unknown> = Record<string, unknown>,
    TRelMap extends Record<string, Relationship> = Record<string, Relationship>
> {
    type: TType;
    id: string;
    attributes?: TAttrs;
    relationships?: TRelMap;
    links?: { self?: string; related?: string;[k: string]: string | undefined };
    meta?: Record<string, JsonValue>;
}

// ===== JSON:API Documents =====
export interface DataDocumentSingle<TRes extends ResourceObject> extends JsonApiDocumentBase {
    data: TRes | null;
    included?: ResourceObject[];
    errors?: never;
}

export interface DataDocumentMany<TRes extends ResourceObject> extends JsonApiDocumentBase {
    data: TRes[];
    included?: ResourceObject[];
    errors?: never;
}

export interface ErrorDocument extends JsonApiDocumentBase {
    errors: ErrorObject[];
    data?: never;
    included?: never;
}

// Common union
export type JsonApiDocument<TRes extends ResourceObject = ResourceObject> =
    | DataDocumentSingle<TRes>
    | DataDocumentMany<TRes>
    | ErrorDocument;

// ===== Pagination helper =====
export type Paginated<TRes extends ResourceObject> = DataDocumentMany<TRes> & {
    links: TopLevelLinks & { next?: string | null; prev?: string | null };
};

// ===== PCO Rate Limit Headers =====
export interface PcoRateLimitHeaders {
    /** Max requests allowed in the current window (e.g., 100) */
    "X-PCO-API-Request-Rate-Limit"?: string;
    /** Window length in seconds (e.g., 60 or 20) */
    "X-PCO-API-Request-Rate-Period"?: string;
    /** How many requests you've used in the current window */
    "X-PCO-API-Request-Rate-Count"?: string;
    /** Present on 429 responses: seconds to wait before retrying */
    "Retry-After"?: string;
}

// ===== Product base URLs (for reference/documentation) =====
export const PCO_BASE = "https://api.planningcenteronline.com";
export const PCO_BASES = {
    people: `${PCO_BASE}/people/v2`,
    services: `${PCO_BASE}/services/v2`,
    groups: `${PCO_BASE}/groups/v2`,
    checkIns: `${PCO_BASE}/check-ins/v2`,
    giving: `${PCO_BASE}/giving/v2`,
    calendar: `${PCO_BASE}/calendar/v2`,
} as const;

// ===== Example: People -> Emails resource =====
// Endpoint example seen publicly: https://api.planningcenteronline.com/people/v2/emails
// Bind a typed resource using the generic ResourceObject pattern.

export type PeopleEmailType = "Email"; // JSON:API 'type' string as returned by PCO

export interface PeopleEmailAttributes {
    address?: string;
    location?: "home" | "work" | "other" | string;
    primary?: boolean;
    created_at?: string; // ISO8601
    updated_at?: string; // ISO8601
    // ...PCO may add more fields over time
}

export interface PeopleEmailRelationships {
    person?: Relationship<ResourceIdentifier | null>;
}

export type PeopleEmailResource = ResourceObject<
    PeopleEmailType,
    PeopleEmailAttributes,
    PeopleEmailRelationships
>;

export type PeopleEmailsList = Paginated<PeopleEmailResource>;
export type PeopleEmailSingle = DataDocumentSingle<PeopleEmailResource>;

// Usage idea:
// const res = await fetch(`${PCO_BASES.people}/emails`, { headers: {...} });
// const json = (await res.json()) as PeopleEmailsList;
// json.data[0].attributes?.address