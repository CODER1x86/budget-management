/**
 * Seeder Manager
 * Handles database seeding execution and tracking
 */

const fs = require('fs').promises;
const path = require('path');
const Database = require('../../config/database');
const logger = require('../../utils/logger');
const { faker } = require('@faker-js/faker');

class SeederManager {
  constructor() {
    this.db = null;
    this.seedersPath = path.join(__dirname, 'data');
  }

  /**
   * Initialize seeder system
   */
  async init() {
    this.db = await Database.getInstance();
    await this.createSeederHistoryTable();
  }

  /**
   * Create seeder history tracking table
   */
  async createSeederHistoryTable() {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS seeder_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        executed_at DATETIME NOT NULL
      )
    `);
  }

  /**
   * Get all seeder files
   */
  async getSeederFiles() {
    const files = await fs.readdir(this.seedersPath);
    return files
      .filter(f => f.endsWith('.js'))
      .sort();
  }

  /**
   * Get executed seeders
   */
  async getExecutedSeeders() {
    return this.db.all(
      'SELECT name FROM seeder_history ORDER BY executed_at'
    );
  }

  /**
   * Run all seeders
   */
  async seed(options = {}) {
    try {
      await this.init();
      const files = await this.getSeederFiles();
      const executed = await this.getExecutedSeeders();
      const executedNames = executed.map(s => s.name);

      // Filter seeders based on options
      let seedersToRun = files;
      if (options.fresh) {
        await this.truncateAll();
        await this.db.run('DELETE FROM seeder_history');
      } else if (!options.force) {
        seedersToRun = files.filter(file => !executedNames.includes(file));
      }

      if (seedersToRun.length === 0) {
        logger.info('No seeders to run');
        return;
      }

      logger.info(`Running ${seedersToRun.length} seeders`);

      for (const file of seedersToRun) {
        const Seeder = require(path.join(this.seedersPath, file));
        const seeder = new Seeder(file);
        await seeder.execute();
      }

      logger.info('All seeders completed successfully');
    } catch (error) {
      logger.error('Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Truncate all tables except migrations and seeder_history
   */
  async truncateAll() {
    const tables = await this.db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT IN ('migrations', 'seeder_history', 'sqlite_sequence')
    `);

    await this.db.run('BEGIN TRANSACTION');
    try {
      for (const table of tables) {
        await this.db.run(`DELETE FROM ${table.name}`);
        await this.db.run(`DELETE FROM sqlite_sequence WHERE name='${table.name}'`);
      }
      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Generate fake data using faker
   */
  generateFakeData(template, count = 1) {
    const results = [];
    for (let i = 0; i < count; i++) {
      const item = {};
      for (const [key, generator] of Object.entries(template)) {
        item[key] = typeof generator === 'function' ? generator() : generator;
      }
      results.push(item);
    }
    return count === 1 ? results[0] : results;
  }
}

module.exports = new SeederManager();
