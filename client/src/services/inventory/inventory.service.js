import { apiService } from '../api.service.js';

class InventoryService {
    async getInventoryItems(filters = {}) {
        return apiService.request('/inventory/items', {
            method: 'GET',
            params: filters
        });
    }

    async addInventoryItem(itemData) {
        return apiService.request('/inventory/items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    async updateInventoryItem(id, itemData) {
        return apiService.request(`/inventory/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    }

    async deleteInventoryItem(id) {
        return apiService.request(`/inventory/items/${id}`, {
            method: 'DELETE'
        });
    }

    async getInventoryCategories() {
        return apiService.request('/inventory/categories');
    }

    async getInventoryStats() {
        return apiService.request('/inventory/stats');
    }

    async generateInventoryReport(options = {}) {
        return apiService.request('/inventory/report', {
            method: 'POST',
            body: JSON.stringify(options)
        });
    }
}

export const inventoryService = new InventoryService();
