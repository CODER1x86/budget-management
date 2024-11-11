/**
 * User Model
 * Handles all user-related database operations and business logic
 */

const bcrypt = require('bcrypt');
const Database = require('../config/database');
const logger = require('../utils/logger');
const { BCRYPT_ROUNDS } = require('../config/environment');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password (will be hashed)
   * @param {string} userData.name - User's full name
   * @param {string} userData.phone - User's phone number
   * @param {string} [userData.role='user'] - User's role (default: 'user')
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    const db = await Database.getInstance();
    
    try {
      // First, check if email already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const result = await db.run(`
        INSERT INTO users (
          email,
          password,
          name,
          phone,
          role,
          is_verified,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        userData.email,
        userData.password, // Password should already be hashed
        userData.name,
        userData.phone,
        userData.role || 'user',
        false // Default to unverified
      ]);

      const user = await this.findById(result.lastID);
      logger.info(`New user created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findById(id) {
    const db = await Database.getInstance();
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE user_id = ? AND deleted_at IS NULL',
        [id]
      );
      return user || null;
    } catch (error) {
      logger.error(`Error finding user by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User's email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findByEmail(email) {
    const db = await Database.getInstance();
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        [email.toLowerCase()]
      );
      return user || null;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Update user information
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user object
   */
  static async update(id, updates) {
    const db = await Database.getInstance();
    try {
      // Build update query dynamically
      const allowedUpdates = [
        'name', 'phone', 'password', 'is_verified',
        'reset_token', 'role', 'last_login'
      ];
      
      const updateFields = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key) && value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = datetime("now")');
      
      // Add user_id to values array
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE user_id = ? AND deleted_at IS NULL
      `;

      await db.run(query, values);
      
      const updatedUser = await this.findById(id);
      logger.info(`User ${id} updated successfully`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const db = await Database.getInstance();
    try {
      await db.run(`
        UPDATE users 
        SET deleted_at = datetime('now') 
        WHERE user_id = ? AND deleted_at IS NULL
      `, [id]);
      
      logger.info(`User ${id} soft deleted`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Change user's password
   * @param {number} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(id, currentPassword, newPassword) {
    const db = await Database.getInstance();
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      
      await this.update(id, { password: hashedPassword });
      logger.info(`Password changed for user ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error changing password for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add token to user's blacklist
   * @param {number} id - User ID
   * @param {string} token - Token to blacklist
   * @returns {Promise<boolean>} Success status
   */
  static async addToTokenBlacklist(id, token) {
    const db = await Database.getInstance();
    try {
      await db.run(`
        INSERT INTO token_blacklist (user_id, token, created_at)
        VALUES (?, ?, datetime('now'))
      `, [id, token]);
      
      logger.info(`Token blacklisted for user ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error blacklisting token for user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} True if token is blacklisted
   */
  static async isTokenBlacklisted(token) {
    const db = await Database.getInstance();
    try {
      const result = await db.get(
        'SELECT * FROM token_blacklist WHERE token = ?',
        [token]
      );
      return !!result;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      throw error;
    }
  }

  /**
   * Get all users (with pagination)
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Paginated users list
   */
  static async getAll({ page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    const db = await Database.getInstance();
    try {
      // Validate sort parameters
      const allowedSortFields = ['created_at', 'email', 'name', 'role'];
      const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const actualSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Calculate offset
      const offset = (page - 1) * limit;

      // Get total count
      const { total } = await db.get(
        'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'
      );

      // Get users
      const users = await db.all(`
        SELECT 
          user_id,
          email,
          name,
          phone,
          role,
          is_verified,
          created_at,
          updated_at
        FROM users 
        WHERE deleted_at IS NULL
        ORDER BY ${actualSortBy} ${actualSortOrder}
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting users list:', error);
      throw error;
    }
  }

  /**
   * Initialize user-related database tables
   * @returns {Promise<void>}
   */
  static async initializeTables() {
    const db = await Database.getInstance();
    try {
      // Users table
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          is_verified BOOLEAN DEFAULT 0,
          reset_token TEXT,
          last_login DATETIME,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          deleted_at DATETIME
        )
      `);

      // Token blacklist table
      await db.run(`
        CREATE TABLE IF NOT EXISTS token_blacklist (
          blacklist_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL,
          created_at DATETIME NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
      `);

      // Create indexes
      await db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
      await db.run('CREATE INDEX IF NOT EXISTS idx_token_blacklist ON token_blacklist(token)');

      logger.info('User tables initialized successfully');
    } catch (error) {
      logger.error('Error initializing user tables:', error);
      throw error;
    }
  }
}

module.exports = User;
