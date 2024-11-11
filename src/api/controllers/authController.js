/**
 * Authentication Controller
 * Handles user authentication, registration, and password management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../../models/User');
const { JWT_SECRET, BCRYPT_ROUNDS } = require('../../config/environment');
const logger = require('../../utils/logger');
const emailService = require('../services/emailService');

class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async register(req, res) {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { email, password, name, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'user'
      });

      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send verification email
      await emailService.sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.'
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during registration' 
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(401).json({ 
          success: false, 
          message: 'Please verify your email first' 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during login' 
      });
    }
  }

  /**
   * Verify email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Update user verification status
      await User.update(decoded.userId, { isVerified: true });

      res.json({ 
        success: true, 
        message: 'Email verified successfully' 
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification token' 
      });
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token to user
      await User.update(user.id, { resetToken });

      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({
        success: true,
        message: 'Password reset instructions sent to email'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error processing password reset request' 
      });
    }
  }

  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || user.resetToken !== token) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired reset token' 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update user password and clear reset token
      await User.update(user.id, {
        password: hashedPassword,
        resetToken: null
      });

      res.json({ 
        success: true, 
        message: 'Password reset successful' 
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error resetting password' 
      });
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      
      // Add token to user's blacklist
      await User.addToTokenBlacklist(req.user.id, token);

      res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during logout' 
      });
    }
  }
}

module.exports = AuthController;
