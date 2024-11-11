class ApiService {
    constructor() {
        this.baseUrl = '/api';
    }

    async request(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async resetPassword(email) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    // Dashboard endpoints
    async getDashboardSummary() {
        return this.request('/dashboard/summary');
    }

    async getRecentTransactions() {
        return this.request('/transactions/recent');
    }
}

export const apiService = new ApiService();
