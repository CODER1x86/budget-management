/**
 * Base Migration Class
 * Provides core functionality for database migrations
 */

const Database = require('../../config/database');
const logger = require('../../utils/logger');

class Migration {
  constructor(version) {
    this.version = version;
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async init() {
    this.db = await Database.getInstance();
  }

  /**
   * Execute migration
   */
  async execute() {
    try {
      await this.init();
      await this.db.run('BEGIN TRANSACTION');
      
      await this.up();
      await this.updateMigrationVersion();
      
      await this.db.run('COMMIT');
      logger.info(`Migration ${this.version} completed successfully`);
    } catch (error) {
      await this.db.run('ROLLBACK');
      logger.error(`Migration ${this.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback migration
   */
  async rollback() {
    try {
      await this.init();
      await this.db.run('BEGIN TRANSACTION');
      
      await this.down();
      await this.removeMigrationVersion();
      
      await this.db.run('COMMIT');
      logger.info(`Migration ${this.version} rolled back successfully`);
    } catch (error) {
      await this.db.run('ROLLBACK');
      logger.error(`Migration ${this.version} rollback failed:`, error);
      throw error;
    }
  }

  /**
   * Update migration version in database
   */
  async updateMigrationVersion() {
    await this.db.run(`
      INSERT INTO migrations (version, executed_at)
      VALUES (?, datetime('now'))
    `, [this.version]);
  }

  /**
   * Remove migration version from database
   */
  async removeMigrationVersion() {
    await this.db.run(
      'DELETE FROM migrations WHERE version = ?',
      [this.version]
    );
  }
}

module.exports = Migration;
