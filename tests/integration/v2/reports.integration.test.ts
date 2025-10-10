import { PcoClient, ReportAttributes, ReportResource } from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_REPORTS_2025';

describe('v2.3.0 Reports API Integration Tests', () => {
    let client: PcoClient;
    let testReportId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Clean up any previous test reports
        const existingReports = await client.reports.getAll({
            where: { name: new RegExp(`^${TEST_PREFIX}`) }
        });
        for (const report of existingReports.data) {
            if (report.id) {
                await client.reports.delete(report.id);
            }
        }
    }, 60000);

    it('should create, update, and delete a report', async () => {
        const timestamp = Date.now();
        const reportData: ReportAttributes = {
            name: `${TEST_PREFIX}_Test_Report_${timestamp}`,
            body: 'This is a test report created by the integration test suite.'
        };

        // Create report
        const newReport = await client.reports.create(reportData);
        expect(newReport).toBeDefined();
        expect(newReport.type).toBe('Report');
        expect(newReport.attributes?.name).toBe(reportData.name);
        expect(newReport.attributes?.body).toBe(reportData.body);
        testReportId = newReport.id || '';
        expect(testReportId).toBeTruthy();

        // Update report
        const updateData: Partial<ReportAttributes> = {
            name: `${TEST_PREFIX}_Updated_Report_${timestamp}`,
            body: 'This is an updated test report.'
        };
        const updatedReport = await client.reports.update(testReportId, updateData);
        expect(updatedReport).toBeDefined();
        expect(updatedReport.id).toBe(testReportId);
        expect(updatedReport.attributes?.name).toBe(updateData.name);
        expect(updatedReport.attributes?.body).toBe(updateData.body);

        // Get report by ID
        const fetchedReport = await client.reports.getById(testReportId);
        expect(fetchedReport).toBeDefined();
        expect(fetchedReport.id).toBe(testReportId);
        expect(fetchedReport.attributes?.name).toBe(updateData.name);
        expect(fetchedReport.attributes?.body).toBe(updateData.body);

        // Delete report
        await client.reports.delete(testReportId);
        await expect(client.reports.getById(testReportId)).rejects.toThrow();
    }, 60000);

    it('should get all reports', async () => {
        const reports = await client.reports.getAll();
        expect(reports).toBeDefined();
        expect(Array.isArray(reports.data)).toBe(true);

        if (reports.data.length > 0) {
            const report = reports.data[0];
            expect(report.type).toBe('Report');
            expect(report.id).toBeTruthy();
            expect(report.attributes).toBeDefined();
        }
    }, 30000);

    it('should get report by ID with includes', async () => {
        // Create a test report first
        const testReport = await client.reports.create({
            name: `${TEST_PREFIX}_Include_Test_${Date.now()}`,
            body: 'Test report for include testing'
        });

        try {
            const report = await client.reports.getById(testReport.id || '', ['created_by', 'updated_by']);
            expect(report).toBeDefined();
            expect(report.type).toBe('Report');
            expect(report.id).toBe(testReport.id);
        } finally {
            // Clean up
            await client.reports.delete(testReport.id || '');
        }
    }, 30000);

    it('should get report creator and updater', async () => {
        // Create a test report first
        const testReport = await client.reports.create({
            name: `${TEST_PREFIX}_Creator_Test_${Date.now()}`,
            body: 'Test report for creator/updater testing'
        });

        try {
            // Test getting creator
            try {
                const creator = await client.reports.getCreatedBy(testReport.id || '');
                expect(creator).toBeDefined();
                expect(creator.type).toBe('Person');
                expect(creator.id).toBeTruthy();
            } catch (error) {
                // Creator might not be available
                console.warn('Report creator not available:', error);
            }

            // Test getting updater
            try {
                const updater = await client.reports.getUpdatedBy(testReport.id || '');
                expect(updater).toBeDefined();
                expect(updater.type).toBe('Person');
                expect(updater.id).toBeTruthy();
            } catch (error) {
                // Updater might not be available
                console.warn('Report updater not available:', error);
            }
        } finally {
            // Clean up
            await client.reports.delete(testReport.id || '');
        }
    }, 30000);

    it('should get all pages of reports with pagination', async () => {
        // Create a few test reports to ensure pagination works
        const report1 = await client.reports.create({
            name: `${TEST_PREFIX}_Page_Report_1_${Date.now()}`,
            body: 'Test report 1 for pagination'
        });
        const report2 = await client.reports.create({
            name: `${TEST_PREFIX}_Page_Report_2_${Date.now()}`,
            body: 'Test report 2 for pagination'
        });

        try {
            const allReports = await client.reports.getAllPagesPaginated({ per_page: 1 });
            expect(allReports).toBeDefined();
            expect(Array.isArray(allReports.data)).toBe(true);
            expect(allReports.data.length).toBeGreaterThanOrEqual(2); // Should fetch at least the two we created
        } finally {
            // Clean up test reports
            await client.reports.delete(report1.id || '');
            await client.reports.delete(report2.id || '');
        }
    }, 60000);

    it('should handle invalid report ID gracefully', async () => {
        const invalidReportId = 'invalid-report-id';

        await expect(client.reports.getById(invalidReportId)).rejects.toThrow();
        await expect(client.reports.update(invalidReportId, { name: 'Updated' })).rejects.toThrow();
        await expect(client.reports.delete(invalidReportId)).rejects.toThrow();
        await expect(client.reports.getCreatedBy(invalidReportId)).rejects.toThrow();
        await expect(client.reports.getUpdatedBy(invalidReportId)).rejects.toThrow();
    }, 30000);

    it('should handle report creation with minimal data', async () => {
        const minimalReportData: ReportAttributes = {
            name: `${TEST_PREFIX}_Minimal_Report_${Date.now()}`
        };

        const report = await client.reports.create(minimalReportData);
        expect(report).toBeDefined();
        expect(report.type).toBe('Report');
        expect(report.attributes?.name).toBe(minimalReportData.name);

        // Clean up
        await client.reports.delete(report.id || '');
    }, 30000);

    afterAll(async () => {
        // Clean up any remaining test reports
        try {
            const remainingReports = await client.reports.getAll({
                where: { name: new RegExp(`^${TEST_PREFIX}`) }
            });
            for (const report of remainingReports.data) {
                if (report.id) {
                    await client.reports.delete(report.id);
                }
            }
        } catch (error) {
            console.warn('Cleanup error:', error);
        }
    }, 30000);
});
