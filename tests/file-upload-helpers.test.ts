import {
    extractFileUrl,
    getFileExtension,
    getFilename,
    isFileUpload,
    isFileUrl,
    processFileValue,
} from '../src/helpers';
import { createPersonFieldData } from '../src/people';
import { createPcoClient } from '../src/core';

// Mock the people module
jest.mock('../src/people', () => ({
    getFieldDefinitions: jest.fn(),
    createPersonFieldData: jest.fn(),
    createPersonFileFieldData: jest.fn(),
}));

describe('File Upload Helper Functions', () => {
    describe('extractFileUrl', () => {
        it('should return clean URL when already clean', () => {
            const cleanUrl = 'https://example.com/file.pdf';
            expect(extractFileUrl(cleanUrl)).toBe(cleanUrl);
        });

        it('should extract URL from HTML anchor tag', () => {
            const htmlValue = '<a href="https://onark.s3.us-east-1.amazonaws.com/document.pdf" download>View File</a>';
            const expected = 'https://onark.s3.us-east-1.amazonaws.com/document.pdf';
            expect(extractFileUrl(htmlValue)).toBe(expected);
        });

        it('should extract URL from text content as fallback', () => {
            const textValue = 'Check out this file: https://example.com/image.jpg for more info';
            const expected = 'https://example.com/image.jpg';
            expect(extractFileUrl(textValue)).toBe(expected);
        });

        it('should return original value if no URL found', () => {
            const textValue = 'This is just regular text with no URLs';
            expect(extractFileUrl(textValue)).toBe(textValue);
        });
    });

    describe('isFileUrl', () => {
        it('should return true for S3 URLs', () => {
            expect(isFileUrl('https://onark.s3.us-east-1.amazonaws.com/file.pdf')).toBe(true);
            expect(isFileUrl('https://bucket.s3.amazonaws.com/image.jpg')).toBe(true);
        });

        it('should return true for AWS URLs', () => {
            expect(isFileUrl('https://example.amazonaws.com/document.docx')).toBe(true);
        });

        it('should return false for non-file URLs', () => {
            expect(isFileUrl('https://example.com/page')).toBe(false);
            expect(isFileUrl('https://google.com')).toBe(false);
        });

        it('should work with HTML markup', () => {
            const htmlValue = '<a href="https://onark.s3.us-east-1.amazonaws.com/file.pdf" download>View File</a>';
            expect(isFileUrl(htmlValue)).toBe(true);
        });
    });

    describe('isFileUpload', () => {
        it('should return true for file URLs', () => {
            expect(isFileUpload('https://onark.s3.us-east-1.amazonaws.com/file.pdf')).toBe(true);
        });

        it('should return true for HTML anchor tags', () => {
            expect(isFileUpload('<a href="https://example.com/file.pdf" download>View File</a>')).toBe(true);
        });

        it('should return false for regular text', () => {
            expect(isFileUpload('This is just regular text')).toBe(false);
        });

        it('should return false for non-file URLs', () => {
            expect(isFileUpload('https://example.com/page')).toBe(false);
        });
    });

    describe('getFileExtension', () => {
        it('should extract file extension from URL', () => {
            expect(getFileExtension('https://example.com/document.pdf')).toBe('pdf');
            expect(getFileExtension('https://example.com/image.jpg')).toBe('jpg');
            expect(getFileExtension('https://example.com/spreadsheet.xlsx')).toBe('xlsx');
        });

        it('should return empty string for URLs without extension', () => {
            expect(getFileExtension('https://example.com/page')).toBe('');
        });

        it('should work with HTML markup', () => {
            const htmlValue = '<a href="https://example.com/file.pdf" download>View File</a>';
            expect(getFileExtension(htmlValue)).toBe('pdf');
        });
    });

    describe('getFilename', () => {
        it('should extract filename from URL', () => {
            expect(getFilename('https://example.com/document.pdf')).toBe('document.pdf');
            expect(getFilename('https://example.com/path/to/image.jpg')).toBe('image.jpg');
        });

        it('should return "file" for URLs without filename', () => {
            expect(getFilename('https://example.com/')).toBe('file');
        });

        it('should work with HTML markup', () => {
            const htmlValue = '<a href="https://example.com/document.pdf" download>View File</a>';
            expect(getFilename(htmlValue)).toBe('document.pdf');
        });
    });

    describe('processFileValue', () => {
        it('should return clean URL for text field type', () => {
            const htmlValue = '<a href="https://example.com/document.pdf" download>View File</a>';
            const result = processFileValue(htmlValue, 'text');
            expect(result).toBe('https://example.com/document.pdf');
        });

        it('should return metadata object for file field type', () => {
            const htmlValue = '<a href="https://example.com/document.pdf" download>View File</a>';
            const result = processFileValue(htmlValue, 'file');

            expect(result).toEqual({
                url: 'https://example.com/document.pdf',
                filename: 'document.pdf',
                contentType: 'application/pdf',
            });
        });

        it('should default to text field type', () => {
            const cleanUrl = 'https://example.com/image.jpg';
            const result = processFileValue(cleanUrl);
            expect(result).toBe(cleanUrl);
        });

        it('should handle various file types correctly', () => {
            const testCases = [
                { url: 'https://example.com/document.pdf', expectedType: 'application/pdf' },
                { url: 'https://example.com/image.jpg', expectedType: 'image/jpeg' },
                { url: 'https://example.com/spreadsheet.xlsx', expectedType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                { url: 'https://example.com/text.txt', expectedType: 'text/plain' },
                { url: 'https://example.com/unknown.xyz', expectedType: 'application/octet-stream' },
            ];

            testCases.forEach(({ url, expectedType }) => {
                const result = processFileValue(url, 'file');
                expect(result).toEqual({
                    url,
                    filename: url.split('/').pop(),
                    contentType: expectedType,
                });
            });
        });
    });

});
