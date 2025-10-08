/**
 * Basic Usage Example for @planning-center-people-ts
 * 
 * This example demonstrates how to use the PCO API client with proper rate limiting.
 */

import {
    createPcoClient,
    getPeople,
    getPerson,
    createPerson,
    updatePerson,
    deletePerson,
} from '../src';

async function basicExample() {
    // Create a client
    const client = createPcoClient({
        personalAccessToken: 'your-token-here',
        appId: 'your-app-id',
        appSecret: 'your-app-secret',
    });

    try {
        // Get all people
        const people = await getPeople(client, {
            per_page: 5,
            include: ['emails'],
        });

        console.log(`Found ${people.data.length} people`);

        // Get a specific person
        if (people.data.length > 0) {
            const person = await getPerson(client, people.data[0].id);
            console.log(`First person: ${person.data?.attributes?.first_name} ${person.data?.attributes?.last_name}`);
        }

        // Create a new person
        const newPerson = await createPerson(client, {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
        });

        console.log(`Created person with ID: ${newPerson.data?.id}`);

        // Update the person
        const updatedPerson = await updatePerson(client, newPerson.data!.id, {
            first_name: 'Jane',
        });

        console.log(`Updated person: ${updatedPerson.data?.attributes?.first_name}`);

        // Delete the person
        await deletePerson(client, newPerson.data!.id);
        console.log('Person deleted');

    } catch (error) {
        console.error('Error:', error);
    }
}

basicExample().catch(console.error);
