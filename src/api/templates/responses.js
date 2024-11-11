/**
 * API Response Templates
 * Predefined response templates for common scenarios
 */

const ResponseTemplates = {
  /**
   * Authentication responses
   */
  auth: {
    registered: {
      message: 'Registration successful. Please verify your email.',
      status: 201
    },
    loggedIn: {
      message: 'Login successful',
      status: 200
    },
    loggedOut: {
      message: 'Logout successful',
      status: 200
    },
    verified: {
      message: 'Email verification successful',
      status: 200
    },
    passwordReset: {
      message: 'Password reset successful',
      status: 200
    },
    passwordChanged: {
      message: 'Password changed successfully',
      status: 200
    }
  },

  /**
   * CRUD operation responses
   */
  crud: {
    created: {
      message: 'Resource created successfully',
      status: 201
    },
    updated: {
      message: 'Resource updated successfully',
      status: 200
    },
    deleted: {
      message: 'Resource deleted successfully',
      status: 200
    },
    restored: {
      message: 'Resource restored successfully',
      status: 200
    }
  },

  /**
   * Error responses
   */
  errors: {
    notFound: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      status: 404
    },
    validation: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400
    },
    unauthorized: {
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED',
      status: 401
    },
    forbidden: {
      message: 'Access forbidden',
      code: 'FORBIDDEN',
      status: 403
    },
    conflict: {
      message: 'Resource conflict',
      code: 'CONFLICT',
      status: 409
    }
  }
};

module.exports = ResponseTemplates;
