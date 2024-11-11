import { apiService } from '../api.service.js';
import { dateUtils } from '../../utils/dateUtils.js';

class AnalyticsService {
    async getDashboardMetrics(period = 'month') {
        return apiService.request('/analytics/dashboard', {
            method: 'GET',
            params: { period }
        });
    }

    async getRevenueAnalytics(filters = {}) {
        return apiService.request('/analytics/revenue', {
            method: 'GET',
            params: filters
        });
    }

    async getExpenseAnalytics(filters = {}) {
        return apiService.request('/analytics/expenses', {
            method: 'GET',
            params: filters
        });
    }

    async getInventoryAnalytics(filters = {}) {
        return apiService.request('/analytics/inventory', {
            method: 'GET',
            params: filters
        });
    }

    async generateReport(type, options = {}) {
        return apiService.request('/analytics/reports', {
            method: 'POST',
            body: JSON.stringify({ type, ...options })
        });
    }

    async getCustomReport(config) {
        return apiService.request('/analytics/custom-report', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async exportData(format, filters = {}) {
        return apiService.request('/analytics/export', {
            method: 'POST',
            body: JSON.stringify({ format, filters })
        });
    }
}

export const analyticsService = new AnalyticsService();
