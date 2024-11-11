/**
 * Authentication Middleware
 * Handles JWT verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/environment');
const logger = require('../../utils/logger');
const { User } = require('../../models/User');

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token missing' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if token is in blacklist (for logged out tokens)
    if (user.tokenBlacklist && user.tokenBlacklist.includes(token)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has been invalidated' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication' 
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of required roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole
};
