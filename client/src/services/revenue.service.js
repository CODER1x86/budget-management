import { apiService } from './api.service.js';

class RevenueService {
    async getRevenueList(filters = {}) {
        return apiService.request('/revenue/list', {
            method: 'GET',
            params: filters
        });
    }

    async addRevenue(revenueData) {
        return apiService.request('/revenue/add', {
            method: 'POST',
            body: JSON.stringify(revenueData)
        });
    }

    async updateRevenue(id, revenueData) {
        return apiService.request(`/revenue/${id}`, {
            method: 'PUT',
            body: JSON.stringify(revenueData)
        });
    }

    async deleteRevenue(id) {
        return apiService.request(`/revenue/${id}`, {
            method: 'DELETE'
        });
    }

    async getRevenueStats(period = 'monthly') {
        return apiService.request(`/revenue/stats/${period}`);
    }

    async exportRevenue(format = 'pdf', filters = {}) {
        return apiService.request('/revenue/export', {
            method: 'POST',
            body: JSON.stringify({ format, filters })
        });
    }
}

export const revenueService = new RevenueService();
