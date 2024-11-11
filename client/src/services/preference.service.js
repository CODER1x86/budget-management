import { apiService } from './api.service.js';

class PreferenceService {
    constructor() {
        this.preferences = null;
        this.callbacks = new Set();
    }

    async loadPreferences() {
        try {
            const response = await apiService.request('/preferences');
            this.preferences = response.preferences;
            this.notifySubscribers();
            return this.preferences;
        } catch (error) {
            console.error('Error loading preferences:', error);
            throw error;
        }
    }

    async updatePreferences(newPreferences) {
        try {
            const response = await apiService.request('/preferences', {
                method: 'PUT',
                body: JSON.stringify(newPreferences)
            });
            
            this.preferences = response.preferences;
            this.notifySubscribers();
            return this.preferences;
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }

    subscribe(callback) {
        this.callbacks.add(callback);
        if (this.preferences) {
            callback(this.preferences);
        }
    }

    unsubscribe(callback) {
        this.callbacks.delete(callback);
    }

    notifySubscribers() {
        this.callbacks.forEach(callback => callback(this.preferences));
    }

    async resetPreferences() {
        try {
            const response = await apiService.request('/preferences/reset', {
                method: 'POST'
            });
            
            this.preferences = response.preferences;
            this.notifySubscribers();
            return this.preferences;
        } catch (error) {
            console.error('Error resetting preferences:', error);
            throw error;
        }
    }

    getPreference(key) {
        return this.preferences ? this.preferences[key] : null;
    }
}

export const preferenceService = new PreferenceService();

// Initialize preferences when the module is imported
preferenceService.loadPreferences().catch(console.error);
