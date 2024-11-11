/**
 * Migration Manager
 * Handles database migration execution and tracking
 */

const fs = require('fs').promises;
const path = require('path');
const Database = require('../../config/database');
const logger = require('../../utils/logger');

class MigrationManager {
  constructor() {
    this.db = null;
    this.migrationsPath = path.join(__dirname, 'versions');
  }

  /**
   * Initialize migration system
   */
  async init() {
    this.db = await Database.getInstance();
    await this.createMigrationsTable();
  }

  /**
   * Create migrations tracking table
   */
  async createMigrationsTable() {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        version TEXT PRIMARY KEY,
        executed_at DATETIME NOT NULL,
        execution_time INTEGER,
        checksum TEXT
      )
    `);
  }

  /**
   * Get all migration files
   */
  async getMigrationFiles() {
    const files = await fs.readdir(this.migrationsPath);
    return files
      .filter(f => f.endsWith('.js'))
      .sort((a, b) => {
        const versionA = a.split('_')[0];
        const versionB = b.split('_')[0];
        return versionA.localeCompare(versionB);
      });
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations() {
    return this.db.all(
      'SELECT version FROM migrations ORDER BY version'
    );
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations() {
    const files = await this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();
    const executedVersions = executed.map(m => m.version);

    return files.filter(file => {
      const version = file.split('_')[0];
      return !executedVersions.includes(version);
    });
  }

  /**
   * Run pending migrations
   */
  async migrate() {
    try {
      await this.init();
      const pending = await this.getPendingMigrations();

      if (pending.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pending.length} pending migrations`);

      for (const file of pending) {
        const start = Date.now();
        const version = file.split('_')[0];
        const Migration = require(path.join(this.migrationsPath, file));
        const migration = new Migration(version);

        logger.info(`Executing migration ${version}`);
        await migration.execute();

        const executionTime = Date.now() - start;
        await this.updateMigrationMetadata(version, executionTime);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollback() {
    try {
      await this.init();
      const executed = await this.getExecutedMigrations();

      if (executed.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const lastMigration = executed[executed.length - 1];
      const files = await this.getMigrationFiles();
      const file = files.find(f => f.startsWith(lastMigration.version));

      if (!file) {
        throw new Error(`Migration file for version ${lastMigration.version} not found`);
      }

      const Migration = require(path.join(this.migrationsPath, file));
      const migration = new Migration(lastMigration.version);

      logger.info(`Rolling back migration ${lastMigration.version}`);
      await migration.rollback();

      logger.info('Rollback completed successfully');
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Update migration metadata
   */
  async updateMigrationMetadata(version, executionTime) {
    await this.db.run(`
      UPDATE migrations 
      SET execution_time = ?, 
          checksum = ?
      WHERE version = ?
    `, [executionTime, this.calculateChecksum(version), version]);
  }

  /**
   * Calculate migration checksum
   */
  calculateChecksum(version) {
    const crypto = require('crypto');
    const file = path.join(this.migrationsPath, `${version}_migration.js`);
    const content = require('fs').readFileSync(file, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Verify migration integrity
   */
  async verifyIntegrity() {
    const executed = await this.getExecutedMigrations();
    const issues = [];

    for (const migration of executed) {
      const currentChecksum = this.calculateChecksum(migration.version);
      const storedChecksum = migration.checksum;

      if (currentChecksum !== storedChecksum) {
        issues.push({
          version: migration.version,
          issue: 'Checksum mismatch'
        });
      }
    }

    return issues;
  }
}

module.exports = new MigrationManager();
