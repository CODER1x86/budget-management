import { errorUtils } from '../../../utils/errorUtils.js';
import { showToast } from '../../../utils/helpers.js';

export class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || message);
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
    }

    handleError(error) {
        const processedError = errorUtils.handleError(error);

        switch (processedError.type) {
            case 'API_ERROR':
                this.handleApiError(processedError);
                break;
            case 'NETWORK_ERROR':
                this.handleNetworkError(processedError);
                break;
            case 'VALIDATION_ERROR':
                this.handleValidationError(processedError);
                break;
            case 'AUTH_ERROR':
                this.handleAuthError(processedError);
                break;
            default:
                this.handleGenericError(processedError);
        }

        // Log error to monitoring service
        this.logError(processedError);
    }

    handleApiError(error) {
        if (error.status === 404) {
            showToast('The requested resource was not found', 'error');
        } else if (error.status >= 500) {
            showToast('A server error occurred. Please try again later', 'error');
        } else {
            showToast(error.message || 'An error occurred', 'error');
        }
    }

    handleNetworkError(error) {
        showToast('Network connection error. Please check your internet connection', 'error');
    }

    handleValidationError(error) {
        if (error.details && typeof error.details === 'object') {
            Object.entries(error.details).forEach(([field, message]) => {
                const element = document.querySelector(`[name="${field}"]`);
                if (element) {
                    this.showFieldError(element, message);
                }
            });
        }
        showToast('Please correct the errors in the form', 'error');
    }

    handleAuthError(error) {
        if (error.status === 401) {
            showToast('Your session has expired. Please log in again', 'error');
            window.location.href = '/login.html';
        } else {
            showToast('You do not have permission to perform this action', 'error');
        }
    }

    handleGenericError(error) {
        showToast('An unexpected error occurred', 'error');
        console.error('Generic Error:', error);
    }

    showFieldError(element, message) {
        // Add error class to the input
        element.classList.add('invalid');

        // Create or update error message
        let errorElement = element.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('span');
            errorElement.classList.add('error-message', 'red-text');
            element.parentNode.insertBefore(errorElement, element.nextSibling);
        }
        errorElement.textContent = message;
    }

    logError(error) {
        // Implementation for error logging service
        console.error('Logged Error:', {
            timestamp: new Date().toISOString(),
            type: error.type,
            message: error.message,
            details: error.details,
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    }
}
