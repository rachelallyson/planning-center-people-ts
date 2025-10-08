import {
  getPeople,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  getPersonEmails,
  createPersonEmail,
  getPersonPhoneNumbers,
  createPersonPhoneNumber,
  getPersonAddresses,
  createPersonAddress,
  getPersonFieldData,
  createPersonFieldData,
  getHouseholds,
  getHousehold,
  getFieldDefinitions,
  getPersonSocialProfiles,
  createPersonSocialProfile,
  getFieldOptions,
  createFieldOption,
  getWorkflowCards,
  createWorkflowCard,
  getWorkflowCardNotes,
  createWorkflowCardNote
} from '../src/people';
import { createPcoClient } from '../src/core';

// Mock the core functions
jest.mock('../src/core', () => ({
  ...jest.requireActual('../src/core'),
  getList: jest.fn(),
  getSingle: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  del: jest.fn()
}));

import { getList, getSingle, post, patch, del } from '../src/core';

const mockGetList = getList as jest.MockedFunction<typeof getList>;
const mockGetSingle = getSingle as jest.MockedFunction<typeof getSingle>;
const mockPost = post as jest.MockedFunction<typeof post>;
const mockPatch = patch as jest.MockedFunction<typeof patch>;
const mockDel = del as jest.MockedFunction<typeof del>;

describe('People API Functions', () => {
  let client: ReturnType<typeof createPcoClient>;

  beforeEach(() => {
    client = createPcoClient({ accessToken: 'test-token' });
    jest.clearAllMocks();
  });

  describe('getPeople', () => {
    it('should call getList with correct parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person' }],
        links: { self: '/people' }
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getPeople(client, {
        where: { status: 'active' },
        include: ['emails'],
        per_page: 10,
        page: 1
      });

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people',
        {
          'where[status]': 'active',
          include: 'emails',
          per_page: 10,
          page: 1
        },
        {
          endpoint: '/people',
          method: 'GET'
        }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle minimal parameters', async () => {
      const mockResponse = { data: [], links: {} };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      await getPeople(client);

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people',
        {},
        {
          endpoint: '/people',
          method: 'GET'
        }
      );
    });
  });

  describe('getPerson', () => {
    it('should call getSingle with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John' } }
      };
      mockGetSingle.mockResolvedValueOnce(mockResponse as any);

      const result = await getPerson(client, '1', ['emails', 'phone_numbers']);

      expect(mockGetSingle).toHaveBeenCalledWith(
        client,
        '/people/1',
        { include: 'emails,phone_numbers' },
        {
          endpoint: '/people/1',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle no include parameter', async () => {
      const mockResponse = { data: { id: '1', type: 'Person' } };
      mockGetSingle.mockResolvedValueOnce(mockResponse as any);

      await getPerson(client, '1');

      expect(mockGetSingle).toHaveBeenCalledWith(
        client,
        '/people/1',
        {},
        {
          endpoint: '/people/1',
          method: 'GET',
          personId: '1'
        }
      );
    });
  });

  describe('createPerson', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createPerson(client, {
        first_name: 'John',
        last_name: 'Doe'
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people',
        { first_name: 'John', last_name: 'Doe' },
        undefined,
        {
          endpoint: '/people',
          method: 'POST'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('updatePerson', () => {
    it('should call patch with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'Jane' } }
      };
      mockPatch.mockResolvedValueOnce(mockResponse as any);

      const result = await updatePerson(client, '1', {
        first_name: 'Jane'
      });

      expect(mockPatch).toHaveBeenCalledWith(
        client,
        '/people/1',
        { first_name: 'Jane' },
        undefined,
        {
          endpoint: '/people/1',
          method: 'PATCH',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('deletePerson', () => {
    it('should call del with correct parameters', async () => {
      mockDel.mockResolvedValueOnce(undefined);

      await deletePerson(client, '1');

      expect(mockDel).toHaveBeenCalledWith(
        client,
        '/people/1',
        undefined,
        {
          endpoint: '/people/1',
          method: 'DELETE',
          personId: '1'
        }
      );
    });
  });

  describe('getPersonEmails', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Email', attributes: { address: 'test@example.com' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getPersonEmails(client, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/emails',
        undefined,
        {
          endpoint: '/people/1/emails',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createPersonEmail', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Email', attributes: { address: 'test@example.com' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createPersonEmail(client, '1', {
        address: 'test@example.com',
        location: 'work',
        primary: false
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people/1/emails',
        { address: 'test@example.com', location: 'work', primary: false },
        undefined,
        {
          endpoint: '/people/1/emails',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPersonPhoneNumbers', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PhoneNumber', attributes: { number: '555-1234' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getPersonPhoneNumbers(client, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/phone_numbers',
        undefined,
        {
          endpoint: '/people/1/phone_numbers',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createPersonPhoneNumber', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PhoneNumber', attributes: { number: '555-1234' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createPersonPhoneNumber(client, '1', {
        number: '555-1234',
        location: 'home',
        primary: true
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people/1/phone_numbers',
        { number: '555-1234', location: 'home', primary: true },
        undefined,
        {
          endpoint: '/people/1/phone_numbers',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPersonAddresses', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Address', attributes: { address1: '123 Main St' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getPersonAddresses(client, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/addresses',
        undefined,
        {
          endpoint: '/people/1/addresses',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createPersonAddress', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Address', attributes: { address1: '123 Main St' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createPersonAddress(client, '1', {
        address1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people/1/addresses',
        { address1: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
        undefined,
        {
          endpoint: '/people/1/addresses',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPersonFieldData', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getPersonFieldData(client, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/field_data',
        undefined,
        {
          endpoint: '/people/1/field_data',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createPersonFieldData', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createPersonFieldData(client, '1', 'field-def-1', 'Test Value');

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people/1/field_data',
        { field_definition_id: 'field-def-1', value: 'Test Value' },
        undefined,
        {
          endpoint: '/people/1/field_data',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getHouseholds', () => {
    it('should call getList with correct parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Household', attributes: { name: 'Smith Family' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getHouseholds(client, {
        include: ['people'],
        per_page: 10
      });

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/households',
        { include: 'people', per_page: 10 },
        {
          endpoint: '/households',
          method: 'GET'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getHousehold', () => {
    it('should call getSingle with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Household', attributes: { name: 'Smith Family' } }
      };
      mockGetSingle.mockResolvedValueOnce(mockResponse as any);

      const result = await getHousehold(client, '1', ['people']);

      expect(mockGetSingle).toHaveBeenCalledWith(
        client,
        '/households/1',
        { include: 'people' },
        {
          endpoint: '/households/1',
          householdId: '1',
          method: 'GET'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getFieldDefinitions', () => {
    it('should call getList with correct parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDefinition', attributes: { name: 'Custom Field' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getFieldDefinitions(client, {
        include: ['field_options'],
        per_page: 20
      });

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/field_definitions',
        { include: 'field_options', per_page: 20 },
        {
          endpoint: '/field_definitions',
          method: 'GET'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPersonSocialProfiles', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'SocialProfile', attributes: { service: 'twitter' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getPersonSocialProfiles(client, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/social_profiles',
        undefined,
        {
          endpoint: '/people/1/social_profiles',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createPersonSocialProfile', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'SocialProfile', attributes: { service: 'twitter' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createPersonSocialProfile(client, '1', {
        service: 'twitter',
        username: 'johndoe'
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people/1/social_profiles',
        { service: 'twitter', username: 'johndoe' },
        undefined,
        {
          endpoint: '/people/1/social_profiles',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getFieldOptions', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldOption', attributes: { value: 'Option 1' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getFieldOptions(client, 'field-def-1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/field_definitions/field-def-1/field_options',
        undefined,
        {
          endpoint: '/field_definitions/field-def-1/field_options',
          fieldDefinitionId: 'field-def-1',
          method: 'GET'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createFieldOption', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldOption', attributes: { value: 'New Option' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createFieldOption(client, 'field-def-1', {
        value: 'New Option',
        sequence: 1
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/field_definitions/field-def-1/field_options',
        { value: 'New Option', sequence: 1 },
        undefined,
        {
          endpoint: '/field_definitions/field-def-1/field_options',
          fieldDefinitionId: 'field-def-1',
          method: 'POST'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getWorkflowCards', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCard', attributes: { title: 'Card 1' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getWorkflowCards(client, '1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/workflow_cards',
        undefined,
        {
          endpoint: '/people/1/workflow_cards',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createWorkflowCard', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { title: 'New Card' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createWorkflowCard(client, 'workflow-1', '1');

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/workflows/workflow-1/cards',
        { person_id: '1' },
        undefined,
        {
          endpoint: '/workflows/workflow-1/cards',
          metadata: { workflowId: 'workflow-1' },
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getWorkflowCardNotes', () => {
    it('should call getList with correct endpoint', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCardNote', attributes: { note: 'Test note' } }]
      };
      mockGetList.mockResolvedValueOnce(mockResponse as any);

      const result = await getWorkflowCardNotes(client, '1', 'card-1');

      expect(mockGetList).toHaveBeenCalledWith(
        client,
        '/people/1/workflow_cards/card-1/notes',
        undefined,
        {
          endpoint: '/people/1/workflow_cards/card-1/notes',
          method: 'GET',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('createWorkflowCardNote', () => {
    it('should call post with correct parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCardNote', attributes: { note: 'New note' } }
      };
      mockPost.mockResolvedValueOnce(mockResponse as any);

      const result = await createWorkflowCardNote(client, '1', 'card-1', {
        note: 'New note'
      });

      expect(mockPost).toHaveBeenCalledWith(
        client,
        '/people/1/workflow_cards/card-1/notes',
        { note: 'New note' },
        undefined,
        {
          endpoint: '/people/1/workflow_cards/card-1/notes',
          method: 'POST',
          personId: '1'
        }
      );
      expect(result).toBe(mockResponse);
    });
  });
});
