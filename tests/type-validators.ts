/**
 * Type Validation Helpers for Integration Tests
 * 
 * These functions validate that actual PCO API responses match our TypeScript type definitions
 */

/**
 * Validates basic resource structure (type, id)
 */
export function validateResourceStructure(
  resource: any,
  expectedType: string,
  context: string = 'resource'
) {
  expect(resource).toBeDefined();
  expect(resource).toHaveProperty('type');
  expect(resource.type).toBe(expectedType);
  expect(resource).toHaveProperty('id');
  expect(typeof resource.id).toBe('string');
  expect(resource.id.length).toBeGreaterThan(0);
}

/**
 * Validates that an attribute has one of the allowed types
 */
export function validateAttributeType(
  attributes: any,
  field: string,
  allowedTypes: string[],
  context: string = 'attribute'
) {
  if (attributes && field in attributes) {
    const actualType = attributes[field] === null ? 'null' : typeof attributes[field];
    expect(allowedTypes).toContain(actualType);
  }
}

/**
 * Validates string attribute (can be string or undefined)
 */
export function validateStringAttribute(
  attributes: any,
  field: string
) {
  validateAttributeType(attributes, field, ['string', 'undefined'], field);
}

/**
 * Validates nullable string attribute (can be string, null, or undefined)
 */
export function validateNullableStringAttribute(
  attributes: any,
  field: string
) {
  validateAttributeType(attributes, field, ['string', 'null', 'undefined'], field);
}

/**
 * Validates boolean attribute (can be boolean or undefined)
 */
export function validateBooleanAttribute(
  attributes: any,
  field: string
) {
  validateAttributeType(attributes, field, ['boolean', 'undefined'], field);
}

/**
 * Validates number attribute (can be number or undefined)
 */
export function validateNumberAttribute(
  attributes: any,
  field: string
) {
  validateAttributeType(attributes, field, ['number', 'undefined'], field);
}

/**
 * Validates ISO8601 date string format
 */
export function validateDateAttribute(
  attributes: any,
  field: string
) {
  if (attributes && field in attributes && attributes[field]) {
    const value = attributes[field];
    expect(typeof value).toBe('string');
    // Basic ISO8601 format check (YYYY-MM-DDTHH:mm:ss)
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(iso8601Regex.test(value)).toBe(true);
  }
}

/**
 * Validates relationship structure
 */
export function validateRelationship(
  relationship: any,
  context: string = 'relationship'
) {
  if (relationship) {
    expect(relationship).toHaveProperty('data');
    // data can be null, a resource identifier, or an array of resource identifiers
    if (relationship.data !== null && relationship.data !== undefined) {
      if (Array.isArray(relationship.data)) {
        relationship.data.forEach((item: any) => {
          expect(item).toHaveProperty('type');
          expect(item).toHaveProperty('id');
        });
      } else {
        expect(relationship.data).toHaveProperty('type');
        expect(relationship.data).toHaveProperty('id');
      }
    }
  }
}

/**
 * Validates that included resources match expected types
 */
export function validateIncludedResources(
  included: any[] | undefined,
  expectedTypes: string[]
) {
  if (included && Array.isArray(included)) {
    included.forEach(resource => {
      expect(resource).toHaveProperty('type');
      expect(expectedTypes).toContain(resource.type);
      expect(resource).toHaveProperty('id');
      expect(typeof resource.id).toBe('string');
    });
  }
}

/**
 * Validates pagination links structure
 */
export function validatePaginationLinks(links: any) {
  if (links) {
    expect(links).toHaveProperty('self');
    if (links.self) {
      expect(typeof links.self).toBe('string');
    }
    // next and prev can be null or strings
    if ('next' in links) {
      expect(['string', 'null', 'undefined']).toContain(typeof links.next === null ? 'null' : typeof links.next);
    }
    if ('prev' in links) {
      expect(['string', 'null', 'undefined']).toContain(typeof links.prev === null ? 'null' : typeof links.prev);
    }
  }
}

/**
 * Validates pagination metadata
 */
export function validatePaginationMeta(meta: any) {
  if (meta) {
    // Count is usually present
    if ('count' in meta) {
      expect(typeof meta.count).toBe('number');
    }
    // Total count may be present
    if ('total_count' in meta) {
      expect(typeof meta.total_count).toBe('number');
    }
  }
}

