/**
 * Report Job Processor
 * Handles report generation and distribution
 */

const reportService = require('../../services/reportService');
const storageService = require('../../services/storageService');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');

module.exports = {
  name: 'report',
  concurrency: 2,

  async process(job) {
    const { type, data } = job.data;

    logger.info(`Processing report job ${job.id} of type ${type}`);

    switch (type) {
      case 'financial-report':
        const financialReport = await reportService.generateFinancialReport(data.period);
        const financialReportUrl = await storageService.storeReport(financialReport);
        await emailService.sendReportEmail(data.recipients, financialReportUrl);
        break;

      case 'occupancy-report':
        const occupancyReport = await reportService.generateOccupancyReport(data.period);
        const occupancyReportUrl = await storageService.storeReport(occupancyReport);
        await emailService.sendReportEmail(data.recipients, occupancyReportUrl);
        break;

      case 'maintenance-summary':
        const maintenanceReport = await reportService.generateMaintenanceReport(data.period);
        const maintenanceReportUrl = await storageService.storeReport(maintenanceReport);
        await emailService.sendReportEmail(data.recipients, maintenanceReportUrl);
        break;

      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    return { success: true };
  }
};
