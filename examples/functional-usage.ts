import {
    createPcoClient,
    getPeople,
    getPerson,
    createPerson,
    updatePerson,
    deletePerson,
    getPersonEmails,
    createPersonEmail,
    getRateLimitInfo,
} from '../src';

async function example() {
    // Create a client (no external dependencies needed!)
    const client = createPcoClient({
        personalAccessToken: 'your-token-here',
        appId: 'your-app-id',
        appSecret: 'your-app-secret',
        // Or use OAuth 2.0:
        // accessToken: 'your-oauth-token',
    });

    try {
        // Get all people
        const people = await getPeople(client, {
            per_page: 10,
            include: ['emails', 'phone_numbers'],
        });
        console.log(`Found ${people.data.length} people`);

        // Get a specific person
        if (people.data.length > 0) {
            const person = await getPerson(client, people.data[0].id, ['emails']);
            console.log(`Person: ${person.data?.attributes?.first_name} ${person.data?.attributes?.last_name}`);
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

        // Get person's emails
        const emails = await getPersonEmails(client, newPerson.data!.id);
        console.log(`Person has ${emails.data.length} email(s)`);

        // Add an email
        const newEmail = await createPersonEmail(client, newPerson.data!.id, {
            address: 'jane.doe@example.com',
            location: 'work',
            primary: false,
        });
        console.log(`Added email: ${newEmail.data?.attributes?.address}`);

        // Check rate limit info
        const rateLimitInfo = getRateLimitInfo(client);
        console.log('Rate limit info:', rateLimitInfo);

        // Clean up - delete the person
        await deletePerson(client, newPerson.data!.id);
        console.log('Person deleted');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
example().catch(console.error);
