/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authValidation = require('../middleware/validation');
const { authMiddleware, requireRole } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * Rate limiting configuration for authentication routes
 * More restrictive than general rate limiting
 */
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts. Please try again later.'
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    {email, password, name, phone}
 */
router.post(
  '/register',
  authValidation.register,
  async (req, res) => {
    await AuthController.register(req, res);
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 * @body    {email, password}
 */
router.post(
  '/login',
  authRateLimiter,
  authValidation.login,
  async (req, res) => {
    await AuthController.login(req, res);
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate token
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.post(
  '/logout',
  authMiddleware,
  async (req, res) => {
    await AuthController.logout(req, res);
  }
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user's email address
 * @access  Public
 * @param   {string} token - Email verification token
 */
router.get(
  '/verify-email/:token',
  async (req, res) => {
    await AuthController.verifyEmail(req, res);
  }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @body    {email}
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  authValidation.forgotPassword,
  async (req, res) => {
    await AuthController.forgotPassword(req, res);
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 * @body    {token, newPassword}
 */
router.post(
  '/reset-password',
  authRateLimiter,
  authValidation.resetPassword,
  async (req, res) => {
    await AuthController.resetPassword(req, res);
  }
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user's profile
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.get(
  '/profile',
  authMiddleware,
  async (req, res) => {
    try {
      // Remove sensitive information
      const { password, resetToken, tokenBlacklist, ...userProfile } = req.user;
      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {name, phone, currentPassword, newPassword?}
 */
router.put(
  '/profile',
  authMiddleware,
  async (req, res) => {
    await AuthController.updateProfile(req, res);
  }
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.post(
  '/refresh-token',
  authMiddleware,
  async (req, res) => {
    await AuthController.refreshToken(req, res);
  }
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {currentPassword, newPassword}
 */
router.post(
  '/change-password',
  authMiddleware,
  authValidation.changePassword,
  async (req, res) => {
    await AuthController.changePassword(req, res);
  }
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {password}
 */
router.delete(
  '/account',
  authMiddleware,
  async (req, res) => {
    await AuthController.deleteAccount(req, res);
  }
);

/**
 * Admin Routes
 */

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 * @header  Authorization: Bearer <token>
 */
router.get(
  '/users',
  authMiddleware,
  requireRole(['admin']),
  async (req, res) => {
    await AuthController.getAllUsers(req, res);
  }
);

/**
 * @route   PUT /api/auth/users/:userId/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 * @header  Authorization: Bearer <token>
 * @body    {role}
 */
router.put(
  '/users/:userId/role',
  authMiddleware,
  requireRole(['admin']),
  async (req, res) => {
    await AuthController.updateUserRole(req, res);
  }
);

/**
 * @route   POST /api/auth/users/:userId/disable
 * @desc    Disable/Enable user account (admin only)
 * @access  Private/Admin
 * @header  Authorization: Bearer <token>
 * @body    {disabled: boolean}
 */
router.post(
  '/users/:userId/disable',
  authMiddleware,
  requireRole(['admin']),
  async (req, res) => {
    await AuthController.toggleUserStatus(req, res);
  }
);

module.exports = router;
