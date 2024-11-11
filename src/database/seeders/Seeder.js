/**
 * Base Seeder Class
 * Provides core functionality for database seeding
 */

const Database = require('../../config/database');
const logger = require('../../utils/logger');

class Seeder {
  constructor(name) {
    this.name = name;
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async init() {
    this.db = await Database.getInstance();
  }

  /**
   * Execute seeder
   */
  async execute() {
    try {
      await this.init();
      await this.db.run('BEGIN TRANSACTION');
      
      await this.seed();
      await this.recordSeeding();
      
      await this.db.run('COMMIT');
      logger.info(`Seeder ${this.name} completed successfully`);
    } catch (error) {
      await this.db.run('ROLLBACK');
      logger.error(`Seeder ${this.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Record seeding in database
   */
  async recordSeeding() {
    await this.db.run(`
      INSERT INTO seeder_history (name, executed_at)
      VALUES (?, datetime('now'))
    `, [this.name]);
  }
}

module.exports = Seeder;
