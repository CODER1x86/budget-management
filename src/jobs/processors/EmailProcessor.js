/**
 * Email Job Processor
 * Handles email sending jobs
 */

const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');

module.exports = {
  name: 'email',
  concurrency: 5,

  async process(job) {
    const { type, data } = job.data;

    logger.info(`Processing email job ${job.id} of type ${type}`);

    switch (type) {
      case 'welcome':
        await emailService.sendWelcomeEmail(data.user);
        break;

      case 'reset-password':
        await emailService.sendPasswordResetEmail(data.user, data.token);
        break;

      case 'maintenance-notification':
        await emailService.sendMaintenanceNotification(data.user, data.request);
        break;

      case 'property-update':
        await emailService.sendPropertyUpdateEmail(data.user, data.property);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return { success: true };
  }
};
