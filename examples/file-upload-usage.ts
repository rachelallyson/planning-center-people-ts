import { createPcoClient, createPersonFieldData, extractFileUrl, isFileUpload, processFileValue } from '../src';

// Example usage of the new file upload handling functionality

async function exampleFileUploadHandling() {
    // Initialize the PCO client
    const client = createPcoClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret',
        // or use accessToken: 'your-access-token'
    });

    const personId = '12345';
    const fieldId = '67890';

    // Example 1: HTML anchor tag with file URL
    const htmlFileValue = '<a href="https://onark.s3.us-east-1.amazonaws.com/document.pdf" download>View File: https://onark.s3.us-east-1.amazonaws.com/document.pdf</a>';

    // Example 2: Clean file URL
    const cleanFileUrl = 'https://onark.s3.us-east-1.amazonaws.com/image.jpg';

    // Example 3: Regular text value
    const textValue = 'This is just regular text';

    // Check if values are file uploads
    console.log('HTML value is file upload:', isFileUpload(htmlFileValue)); // true
    console.log('Clean URL is file upload:', isFileUpload(cleanFileUrl)); // true
    console.log('Text value is file upload:', isFileUpload(textValue)); // false

    // Extract clean URLs
    console.log('Extracted from HTML:', extractFileUrl(htmlFileValue)); // https://onark.s3.us-east-1.amazonaws.com/document.pdf
    console.log('Extracted from clean URL:', extractFileUrl(cleanFileUrl)); // https://onark.s3.us-east-1.amazonaws.com/image.jpg

    // Process file values for different field types
    const textFieldResult = processFileValue(htmlFileValue, 'text');
    const fileFieldResult = processFileValue(htmlFileValue, 'file');

    console.log('Text field result:', textFieldResult); // Clean URL string
    console.log('File field result:', fileFieldResult); // Object with url, filename, contentType

    // Smart field data creation - automatically determines field type and handles appropriately
    try {
        // This will:
        // 1. Check the field definition to determine if it's a file field
        // 2. For file fields: Use file upload method
        // 3. For text fields: Clean URLs from HTML markup
        const result = await createPersonFieldData(
            client,
            personId,
            fieldId,
            htmlFileValue
        );

        console.log('Smart field data creation result:', result);
    } catch (error) {
        console.error('Error creating field data:', error);
    }
}

// Example of handling different file types
function demonstrateFileProcessing() {
    const fileUrls = [
        'https://example.com/document.pdf',
        'https://example.com/image.jpg',
        'https://example.com/spreadsheet.xlsx',
        'https://example.com/text-file.txt',
    ];

    fileUrls.forEach(url => {
        const processed = processFileValue(url, 'file');
        console.log(`File: ${url}`);
        console.log(`Processed:`, processed);
        console.log('---');
    });
}

// Run examples
if (require.main === module) {
    exampleFileUploadHandling().catch(console.error);
    demonstrateFileProcessing();
}

export { exampleFileUploadHandling, demonstrateFileProcessing };
