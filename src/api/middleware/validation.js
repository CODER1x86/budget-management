/**
 * Request Validation Middleware
 * Provides comprehensive request validation using express-validator
 * Includes custom validators and sanitizers
 */

const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');
const logger = require('../../utils/logger');

/**
 * Custom validation rules
 */
const customRules = {
  /**
   * Password strength validator
   * Requires minimum length, uppercase, lowercase, number, and special character
   */
  password: () => 
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  /**
   * Phone number validator
   * Supports multiple formats
   */
  phone: () =>
    body('phone')
      .optional()
      .matches(/^(\+\d{1,3}[- ]?)?\d{10}$/)
      .withMessage('Invalid phone number format'),

  /**
   * Date validator
   * Ensures date is in ISO format and not in the past
   */
  futureDate: (field) =>
    body(field)
      .isISO8601()
      .withMessage('Invalid date format')
      .custom(value => {
        if (new Date(value) < new Date()) {
          throw new Error('Date cannot be in the past');
        }
        return true;
      }),

  /**
   * Currency amount validator
   * Ensures valid currency format with 2 decimal places
   */
  amount: (field) =>
    body(field)
      .isFloat({ min: 0.01, max: 999999.99 })
      .withMessage('Invalid amount')
      .custom(value => {
        if (!/^\d+(\.\d{2})?$/.test(value.toString())) {
          throw new Error('Amount must have exactly 2 decimal places');
        }
        return true;
      })
};

/**
 * Validation schemas for different routes
 */
const validationSchemas = {
  /**
   * User registration validation
   */
  registration: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),
    
    customRules.password(),
    
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    
    customRules.phone(),
    
    body('terms')
      .isBoolean()
      .equals('true')
      .withMessage('You must accept the terms and conditions')
  ],

  /**
   * Login validation
   */
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  /**
   * Property creation validation
   */
  propertyCreation: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Property title is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    
    body('description')
      .trim()
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('address')
      .isObject()
      .withMessage('Address must be an object')
      .custom((value) => {
        const required = ['street', 'city', 'state', 'zipCode'];
        for (const field of required) {
          if (!value[field]) {
            throw new Error(`Address ${field} is required`);
          }
        }
        return true;
      }),
    
    customRules.amount('price'),
    
    body('amenities')
      .optional()
      .isArray()
      .withMessage('Amenities must be an array'),
    
    body('status')
      .isIn(['available', 'rented', 'maintenance'])
      .withMessage('Invalid property status')
  ],

  /**
   * Payment validation
   */
  payment: [
    body('propertyId')
      .isInt()
      .withMessage('Invalid property ID'),
    
    customRules.amount('amount'),
    
    body('paymentMethod')
      .isIn(['credit_card', 'bank_transfer', 'cash'])
      .withMessage('Invalid payment method'),
    
    body('paymentDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid payment date format')
  ],

  /**
   * Maintenance request validation
   */
  maintenanceRequest: [
    body('propertyId')
      .isInt()
      .withMessage('Invalid property ID'),
    
    body('issue')
      .trim()
      .notEmpty()
      .withMessage('Issue description is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Issue description must be between 10 and 500 characters'),
    
    body('priority')
      .isIn(['low', 'medium', 'high', 'emergency'])
      .withMessage('Invalid priority level'),
    
    customRules.futureDate('preferredDate'),
    
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array')
      .custom((value) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        for (const attachment of value) {
          if (!allowedTypes.includes(attachment.type)) {
            throw new Error('Invalid attachment type');
          }
        }
        return true;
      })
  ]
};

/**
 * Validation middleware factory
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.debug('Validation errors:', errors.array());
        throw new ValidationError(errors.array());
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Sanitization middleware
 * Sanitizes common fields
 */
const sanitize = {
  /**
   * Sanitize user input
   */
  user: [
    body('email').trim().normalizeEmail(),
    body('name').trim().escape(),
    body('phone').trim(),
    body('*.').trim().escape()
  ],

  /**
   * Sanitize property input
   */
  property: [
    body('title').trim().escape(),
    body('description').trim().escape(),
    body('address.*.').trim().escape(),
    body('amenities.*').trim().escape()
  ]
};

/**
 * Query parameter validation
 */
const queryValidation = {
  /**
   * Pagination validation
   */
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  /**
   * Sorting validation
   */
  sorting: [
    query('sortBy')
      .optional()
      .isString()
      .isIn(['createdAt', 'price', 'title'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Invalid sort order')
  ]
};

module.exports = {
  validate,
  validationSchemas,
  customRules,
  sanitize,
  queryValidation
};
