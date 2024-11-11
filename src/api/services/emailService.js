/**
 * Email Service
 * Handles all email communications using nodemailer
 * Includes HTML templates and different types of notifications
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const logger = require('../../utils/logger');
const { EMAIL } = require('../../config/environment');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: EMAIL.SERVICE,
      auth: {
        user: EMAIL.USER,
        pass: EMAIL.PASSWORD
      },
      secure: true,
      pool: true, // Use pooled connections
      maxConnections: 5, // Maximum number of simultaneous connections
      maxMessages: 100 // Maximum number of messages per connection
    });

    // Initialize templates cache
    this.templates = {};
    this.initializeTemplates();
  }

  /**
   * Initialize email templates
   * @private
   */
  async initializeTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../../templates/email');
      const templates = {
        welcome: await fs.readFile(path.join(templatesDir, 'welcome.html'), 'utf8'),
        verification: await fs.readFile(path.join(templatesDir, 'verification.html'), 'utf8'),
        passwordReset: await fs.readFile(path.join(templatesDir, 'password-reset.html'), 'utf8'),
        paymentConfirmation: await fs.readFile(path.join(templatesDir, 'payment-confirmation.html'), 'utf8'),
        paymentReminder: await fs.readFile(path.join(templatesDir, 'payment-reminder.html'), 'utf8'),
        maintenanceNotification: await fs.readFile(path.join(templatesDir, 'maintenance-notification.html'), 'utf8'),
        accountUpdate: await fs.readFile(path.join(templatesDir, 'account-update.html'), 'utf8')
      };

      // Compile templates
      for (const [name, template] of Object.entries(templates)) {
        this.templates[name] = handlebars.compile(template);
      }

      logger.info('Email templates initialized successfully');
    } catch (error) {
      logger.error('Error initializing email templates:', error);
      throw error;
    }
  }

  /**
   * Send email using template
   * @private
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Nodemailer send result
   */
  async sendTemplate(to, subject, templateName, data) {
    try {
      if (!this.templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
      }

      const html = this.templates[templateName]({
        ...data,
        year: new Date().getFullYear(),
        supportEmail: EMAIL.SUPPORT_EMAIL
      });

      const mailOptions = {
        from: `"${EMAIL.FROM_NAME}" <${EMAIL.FROM}>`,
        to,
        subject,
        html,
        text: this.stripHtml(html), // Plain text version
        headers: {
          'X-Priority': '1', // High priority
          'X-MSMail-Priority': 'High'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Strip HTML tags for plain text email version
   * @private
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Send welcome email
   * @param {string} to - Recipient email
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Send result
   */
  async sendWelcomeEmail(to, userData) {
    return this.sendTemplate(to, 'Welcome to Property Management System', 'welcome', {
      name: userData.name,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    });
  }

  /**
   * Send email verification
   * @param {string} to - Recipient email
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Send result
   */
  async sendVerificationEmail(to, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    return this.sendTemplate(to, 'Verify Your Email Address', 'verification', {
      verificationUrl,
      expiresIn: '24 hours'
    });
  }

  /**
   * Send password reset email
   * @param {string} to - Recipient email
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(to, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    return this.sendTemplate(to, 'Reset Your Password', 'passwordReset', {
      resetUrl,
      expiresIn: '1 hour'
    });
  }

  /**
   * Send payment confirmation
   * @param {string} to - Recipient email
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Send result
   */
  async sendPaymentConfirmation(to, paymentData) {
    return this.sendTemplate(to, 'Payment Confirmation', 'paymentConfirmation', {
      amount: paymentData.amount,
      date: new Date(paymentData.date).toLocaleDateString(),
      propertyName: paymentData.propertyName,
      receiptUrl: paymentData.receiptUrl
    });
  }

  /**
   * Send payment reminder
   * @param {string} to - Recipient email
   * @param {Object} reminderData - Reminder details
   * @returns {Promise<Object>} Send result
   */
  async sendPaymentReminder(to, reminderData) {
    return this.sendTemplate(to, 'Payment Reminder', 'paymentReminder', {
      dueDate: new Date(reminderData.dueDate).toLocaleDateString(),
      amount: reminderData.amount,
      propertyName: reminderData.propertyName,
      paymentUrl: `${process.env.FRONTEND_URL}/payments/make/${reminderData.paymentId}`
    });
  }

  /**
   * Send maintenance notification
   * @param {string} to - Recipient email
   * @param {Object} maintenanceData - Maintenance details
   * @returns {Promise<Object>} Send result
   */
  async sendMaintenanceNotification(to, maintenanceData) {
    return this.sendTemplate(to, 'Maintenance Notification', 'maintenanceNotification', {
      propertyName: maintenanceData.propertyName,
      maintenanceType: maintenanceData.type,
      scheduledDate: new Date(maintenanceData.date).toLocaleDateString(),
      scheduledTime: maintenanceData.time,
      description: maintenanceData.description,
      contactPerson: maintenanceData.contactPerson,
      contactPhone: maintenanceData.contactPhone
    });
  }

  /**
   * Send account update notification
   * @param {string} to - Recipient email
   * @param {Object} updateData - Update details
   * @returns {Promise<Object>} Send result
   */
  async sendAccountUpdateNotification(to, updateData) {
    return this.sendTemplate(to, 'Account Update Notification', 'accountUpdate', {
      updateType: updateData.type,
      timestamp: new Date().toLocaleString(),
      ipAddress: updateData.ipAddress,
      userAgent: updateData.userAgent
    });
  }

  /**
   * Send bulk emails
   * @param {Array<Object>} emailList - List of emails to send
   * @returns {Promise<Array>} Array of send results
   */
  async sendBulkEmails(emailList) {
    const results = [];
    const chunks = this.chunkArray(emailList, 5); // Process 5 emails at a time

    for (const chunk of chunks) {
      const promises = chunk.map(email => 
        this.sendTemplate(
          email.to,
          email.subject,
          email.template,
          email.data
        ).catch(error => ({
          error,
          to: email.to
        }))
      );

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);

      // Rate limiting - wait 1 second between chunks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Split array into chunks
   * @private
   * @param {Array} array - Array to split
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Verify email service connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
