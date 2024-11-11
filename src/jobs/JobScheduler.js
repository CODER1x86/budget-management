/**
 * Job Scheduler
 * Handles scheduling of recurring jobs
 */

const schedule = require('node-schedule');
const jobQueue = require('./JobQueue');
const logger = require('../utils/logger');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize scheduler
   */
  async init() {
    // Daily maintenance reminders at 9 AM
    this.schedule('maintenance-reminders', '0 9 * * *', async () => {
      await jobQueue.addJob('maintenance', {
        type: 'send-reminders'
      });
    });

    // Weekly financial report every Monday at 6 AM
    this.schedule('weekly-financial-report', '0 6 * * 1', async () => {
      await jobQueue.addJob('report', {
        type: 'financial-report',
        data: {
          period: 'weekly',
          recipients: ['finance@example.com']
        }
      });
    });

    // Monthly occupancy report on 1st of each month at 7 AM
    this.schedule('monthly-occupancy-report', '0 7 1 * *', async () => {
      await jobQueue.addJob('report', {
        type: 'occupancy-report',
        data: {
          period: 'monthly',
          recipients: ['management@example.com']
        }
      });
    });

    // Database cleanup every day at 2 AM
    this.schedule('database-cleanup', '0 2 * * *', async () => {
      await jobQueue.addJob('maintenance', {
        type: 'database-cleanup'
      });
    });

    logger.info('Job scheduler initialized');
  }

  /**
   * Schedule a job
   * @param {string} name - Job name
   * @param {string} cronPattern - Cron pattern
   * @param {Function} handler - Job handler
   */
  schedule(name, cronPattern, handler) {
    const job = schedule.scheduleJob(cronPattern, async () => {
      try {
        logger.info(`Running scheduled job: ${name}`);
        await handler();
      } catch (error) {
        logger.error(`Scheduled job ${name} failed:`, error);
      }
    });

    this.jobs.set(name, job);
    logger.info(`Job ${name} scheduled with pattern: ${cronPattern}`);
  }

  /**
   * Cancel a scheduled job
   * @param {string} name - Job name
   */
  cancelJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.cancel();
      this.jobs.delete(name);
      logger.info(`Job ${name} cancelled`);
    }
  }

  /**
   * Cancel all scheduled jobs
   */
  cancelAll() {
    for (const [name, job] of this.jobs) {
      job.cancel();
      logger.info(`Job ${name} cancelled`);
    }
    this.jobs.clear();
  }
}

module.exports = new JobScheduler();
