/**
 * Maintenance Job Processor
 * Handles maintenance-related background tasks
 */

const maintenanceService = require('../../services/maintenanceService');
const notificationService = require('../../services/notificationService');
const logger = require('../../utils/logger');

module.exports = {
  name: 'maintenance',
  concurrency: 3,

  async process(job) {
    const { type, data } = job.data;

    logger.info(`Processing maintenance job ${job.id} of type ${type}`);

    switch (type) {
      case 'schedule-inspection':
        await maintenanceService.scheduleInspection(data.requestId);
        break;

      case 'assign-contractor':
        await maintenanceService.assignContractor(data.requestId, data.contractorId);
        break;

      case 'send-reminders':
        const requests = await maintenanceService.getPendingRequests();
        for (const request of requests) {
          await notificationService.sendMaintenanceReminder(request);
        }
        break;

      case 'generate-report':
        const report = await maintenanceService.generateReport(data.period);
        await notificationService.sendMaintenanceReport(report);
        break;

      default:
        throw new Error(`Unknown maintenance job type: ${type}`);
    }

    return { success: true };
  }
};
