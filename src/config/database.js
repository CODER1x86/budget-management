/**
 * Database Configuration Module
 * Handles database connection and initialization
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { DATABASE_URL } = require('./environment');
const logger = require('../utils/logger');

class Database {
  static instance = null;
  
  /**
   * Initialize database connection
   * @returns {Promise<object>} Database instance
   */
  static async initialize() {
    if (Database.instance) {
      return Database.instance;
    }

    try {
      const db = await open({
        filename: path.resolve(DATABASE_URL),
        driver: sqlite3.Database
      });
      
      // Enable foreign keys
      await db.run('PRAGMA foreign_keys = ON');
      
      // Create indexes for optimization
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(payment_date);
        CREATE INDEX IF NOT EXISTS idx_units_owner ON units(owner_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
      
      logger.info('Database initialized successfully');
      Database.instance = db;
      return db;
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   * @returns {object} Database instance
   */
  static getInstance() {
    if (!Database.instance) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return Database.instance;
  }

  /**
   * Close database connection
   */
  static async close() {
    if (Database.instance) {
      await Database.instance.close();
      Database.instance = null;
      logger.info('Database connection closed');
    }
  }
}

module.exports = Database;
