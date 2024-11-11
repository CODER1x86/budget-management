/**
 * Job Queue System
 * Handles background job processing using Bull
 */

const Bull = require('bull');
const path = require('path');
const glob = require('glob');
const logger = require('../utils/logger');
const {
  REDIS_URL,
  REDIS_PASSWORD,
  NODE_ENV
} = require('../config/environment');

class JobQueue {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.initialized = false;
  }

  /**
   * Initialize job queue system
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load all job processors
      const processorFiles = glob.sync(path.join(__dirname, 'processors/*.js'));
      for (const file of processorFiles) {
        const processor = require(file);
        this.processors.set(processor.name, processor);
      }

      // Initialize queues
      for (const [name, processor] of this.processors) {
        const queue = new Bull(name, {
          redis: {
            port: new URL(REDIS_URL).port,
            host: new URL(REDIS_URL).hostname,
            password: REDIS_PASSWORD
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000
            },
            removeOnComplete: 100,
            removeOnFail: 500
          }
        });

        // Add queue event handlers
        queue.on('error', error => {
          logger.error(`Queue ${name} error:`, error);
        });

        queue.on('failed', (job, error) => {
          logger.error(`Job ${job.id} in queue ${name} failed:`, error);
        });

        queue.on('completed', job => {
          logger.info(`Job ${job.id} in queue ${name} completed`);
        });

        // Add processor
        queue.process(processor.concurrency || 1, processor.process);

        this.queues.set(name, queue);
        logger.info(`Queue ${name} initialized`);
      }

      this.initialized = true;
      logger.info('Job queue system initialized');
    } catch (error) {
      logger.error('Job queue initialization failed:', error);
      throw error;
    }
  }

  /**
   * Add job to queue
   * @param {string} name - Queue name
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Job>} Created job
   */
  async addJob(name, data, options = {}) {
    await this.init();

    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    const defaultOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: false
    };

    const job = await queue.add(data, { ...defaultOptions, ...options });
    logger.info(`Job ${job.id} added to queue ${name}`);
    return job;
  }

  /**
   * Get queue by name
   * @param {string} name - Queue name
   * @returns {Bull} Queue instance
   */
  getQueue(name) {
    return this.queues.get(name);
  }

  /**
   * Get all queues
   * @returns {Map<string, Bull>} All queues
   */
  getQueues() {
    return this.queues;
  }

  /**
   * Pause all queues
   */
  async pauseAll() {
    for (const [name, queue] of this.queues) {
      await queue.pause();
      logger.info(`Queue ${name} paused`);
    }
  }

  /**
   * Resume all queues
   */
  async resumeAll() {
    for (const [name, queue] of this.queues) {
      await queue.resume();
      logger.info(`Queue ${name} resumed`);
    }
  }

  /**
   * Clean all queues
   */
  async cleanAll() {
    for (const [name, queue] of this.queues) {
      await queue.clean(0, 'completed');
      await queue.clean(0, 'failed');
      logger.info(`Queue ${name} cleaned`);
    }
  }

  /**
   * Close all queues
   */
  async closeAll() {
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    }
  }
}

module.exports = new JobQueue();
