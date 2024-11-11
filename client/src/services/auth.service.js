import { apiService } from './api.service.js';
import { showToast } from '../utils/helpers.js';

class AuthService {
    constructor() {
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
    }

    async login(credentials) {
        try {
            const response = await apiService.login(credentials);
            this.setSession(response);
            return response;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }

    async register(userData) {
        try {
            const response = await apiService.register(userData);
            return response;
        } catch (error) {
            throw new Error('Registration failed: ' + error.message);
        }
    }

    async resetPassword(email) {
        try {
            return await apiService.resetPassword(email);
        } catch (error) {
            throw new Error('Password reset failed: ' + error.message);
        }
    }

    setSession(authResult) {
        localStorage.setItem(this.tokenKey, authResult.token);
        localStorage.setItem(this.userKey, JSON.stringify(authResult.user));
    }

    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        return !!token;
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    getCurrentUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    async validateToken() {
        try {
            await apiService.request('/auth/validate-token');
            return true;
        } catch (error) {
            this.clearSession();
            return false;
        }
    }
}

export const authService = new AuthService();
