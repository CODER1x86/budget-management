export const errorUtils = {
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);

        if (error.response) {
            // Server responded with error status
            return {
                type: 'API_ERROR',
                message: error.response.data.message || 'Server error occurred',
                status: error.response.status,
                details: error.response.data
            };
        } else if (error.request) {
            // Request made but no response received
            return {
                type: 'NETWORK_ERROR',
                message: 'Network error occurred',
                details: error.request
            };
        } else {
            // Error in request setup
            return {
                type: 'CLIENT_ERROR',
                message: error.message || 'An unexpected error occurred',
                details: error
            };
        }
    },

    isNetworkError(error) {
        return error.type === 'NETWORK_ERROR';
    },

    isApiError(error) {
        return error.type === 'API_ERROR';
    },

    isValidationError(error) {
        return error.type === 'API_ERROR' && error.status === 422;
    },

    isAuthenticationError(error) {
        return error.type === 'API_ERROR' && (error.status === 401 || error.status === 403);
    }
};
