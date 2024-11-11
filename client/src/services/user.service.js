import { apiService } from './api.service.js';
import { showToast } from '../utils/helpers.js';

class UserService {
    async getCurrentUser() {
        try {
            return await apiService.request('/user/profile');
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    async updateProfile(userData) {
        try {
            return await apiService.request('/user/profile', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    async updatePassword(passwordData) {
        try {
            return await apiService.request('/user/password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    async updateAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            return await apiService.request('/user/avatar', {
                method: 'POST',
                body: formData,
                headers: {} // Let the browser set the content type for FormData
            });
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    }

    async getNotificationPreferences() {
        try {
            return await apiService.request('/user/notifications/preferences');
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    }

    async updateNotificationPreferences(preferences) {
        try {
            return await apiService.request('/user/notifications/preferences', {
                method: 'PUT',
                body: JSON.stringify(preferences)
            });
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    async deleteAccount(confirmation) {
        try {
            return await apiService.request('/user/account', {
                method: 'DELETE',
                body: JSON.stringify({ confirmation })
            });
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }
}

export const userService = new UserService();
