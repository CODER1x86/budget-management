/**
 * Authentication Service
 * Handles all authentication-related operations including JWT management,
 * password hashing, and session handling
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const { 
  JWT_SECRET, 
  JWT_REFRESH_SECRET,
  BCRYPT_ROUNDS,
  TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION 
} = require('../../config/environment');
const { User } = require('../../models/User');
const { 
  AuthenticationError, 
  AuthorizationError 
} = require('../middleware/errorHandler');
const logger = require('../../utils/logger');
const emailService = require('./emailService');
const redis = require('../../config/redis');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User object and tokens
   */
  static async register(userData) {
    try {
      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      // Generate verification token
      const verificationToken = await this.generateVerificationToken();
      await User.updateVerificationToken(user.id, verificationToken);

      // Send verification email
      await emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      logger.info(`New user registered: ${user.email}`);
      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} ipInfo - IP and device information
   * @returns {Object} User object and tokens
   */
  static async login(email, password, ipInfo) {
    try {
      // Get user
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Check password
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        await this.handleFailedLogin(user.id, ipInfo);
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is locked
      if (await this.isAccountLocked(user.id)) {
        throw new AuthenticationError('Account is locked. Please try again later');
      }

      // Check if email is verified
      if (!user.is_verified) {
        throw new AuthenticationError('Please verify your email address');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Update last login
      await User.updateLastLogin(user.id, ipInfo);

      // Clear failed login attempts
      await this.clearFailedLoginAttempts(user.id);

      logger.info(`User logged in: ${user.email}`);
      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New access and refresh tokens
   */
  static async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken);

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Verify email
   * @param {string} token - Verification token
   * @returns {boolean} Success status
   */
  static async verifyEmail(token) {
    try {
      const user = await User.findByVerificationToken(token);
      if (!user) {
        throw new AuthenticationError('Invalid verification token');
      }

      await User.markEmailAsVerified(user.id);
      return true;
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {boolean} Success status
   */
  static async requestPasswordReset(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Return true to prevent email enumeration
        return true;
      }

      const resetToken = await this.generateResetToken();
      await User.updateResetToken(user.id, resetToken);

      await emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken
      );

      return true;
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  static async resetPassword(token, newPassword) {
    try {
      const user = await User.findByResetToken(token);
      if (!user) {
        throw new AuthenticationError('Invalid reset token');
      }

      const hashedPassword = await this.hashPassword(newPassword);
      await User.updatePassword(user.id, hashedPassword);
      await User.clearResetToken(user.id);

      // Invalidate all existing sessions
      await this.invalidateUserSessions(user.id);

      return true;
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Change password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      const isValidPassword = await this.verifyPassword(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid current password');
      }

      const hashedPassword = await this.hashPassword(newPassword);
      await User.updatePassword(userId, hashedPassword);

      // Invalidate all existing sessions except current
      await this.invalidateUserSessions(userId);

      return true;
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @param {number} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @returns {boolean} Success status
   */
  static async logout(userId, refreshToken) {
    try {
      await this.blacklistToken(refreshToken);
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   * @private
   * @param {Object} user - User object
   * @returns {Object} Access and refresh tokens
   */
  static async generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        tokenVersion: user.tokenVersion
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRATION }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Hash password
   * @private
   * @param {string} password - Plain password
   * @returns {string} Hashed password
   */
  static async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify password
   * @private
   * @param {string} password - Plain password
   * @param {string} hash - Hashed password
   * @returns {boolean} Password validity
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate verification token
   * @private
   * @returns {string} Verification token
   */
  static async generateVerificationToken() {
    const randomBytes = promisify(crypto.randomBytes);
    const buffer = await randomBytes(32);
    return buffer.toString('hex');
  }

  /**
   * Generate reset token
   * @private
   * @returns {string} Reset token
   */
  static async generateResetToken() {
    const randomBytes = promisify(crypto.randomBytes);
    const buffer = await randomBytes(32);
    return buffer.toString('hex');
  }

  /**
   * Handle failed login attempt
   * @private
   * @param {number} userId - User ID
   * @param {Object} ipInfo - IP and device information
   */
  static async handleFailedLogin(userId, ipInfo) {
    const key = `failed_login:${userId}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 3600); // Expire in 1 hour

    if (attempts >= 5) {
      await this.lockAccount(userId);
      logger.warn(`Account locked for user ${userId} due to multiple failed attempts`);
    }

    // Log failed attempt
    logger.warn('Failed login attempt', {
      userId,
      attempts,
      ip: ipInfo.ip,
      userAgent: ipInfo.userAgent
    });
  }

  /**
   * Check if account is locked
   * @private
   * @param {number} userId - User ID
   * @returns {boolean} Lock status
   */
  static async isAccountLocked(userId) {
    const key = `account_locked:${userId}`;
    return redis.exists(key);
  }

  /**
   * Lock account
   * @private
   * @param {number} userId - User ID
   */
  static async lockAccount(userId) {
    const key = `account_locked:${userId}`;
    await redis.set(key, 1);
    await redis.expire(key, 3600); // Lock for 1 hour
  }

  /**
   * Clear failed login attempts
   * @private
   * @param {number} userId - User ID
   */
  static async clearFailedLoginAttempts(userId) {
    const key = `failed_login:${userId}`;
    await redis.del(key);
  }

  /**
   * Blacklist token
   * @private
   * @param {string} token - Token to blacklist
   */
  static async blacklistToken(token) {
    const key = `blacklist:${token}`;
    await redis.set(key, 1);
    await redis.expire(key, 7 * 24 * 3600); // Expire in 7 days
  }

  /**
   * Check if token is blacklisted
   * @private
   * @param {string} token - Token to check
   * @returns {boolean} Blacklist status
   */
  static async isTokenBlacklisted(token) {
    const key = `blacklist:${token}`;
    return redis.exists(key);
  }

  /**
   * Invalidate all user sessions
   * @private
   * @param {number} userId - User ID
   */
  static async invalidateUserSessions(userId) {
    await User.incrementTokenVersion(userId);
  }
}

module.exports = AuthService;
