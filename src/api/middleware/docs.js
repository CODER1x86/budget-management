/**
 * API Documentation Middleware
 * Serves Swagger UI for API documentation
 */

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../../docs/swagger');
const { NODE_ENV } = require('../../config/environment');

const options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Property Management System API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: NODE_ENV !== 'production',
  },
};

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerSpec, options),
};
