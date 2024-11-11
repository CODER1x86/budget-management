import { apiService } from '../api.service.js';
import { showToast } from '../../utils/helpers.js';

class PropertyService {
    async getUnits(filters = {}) {
        try {
            return await apiService.request('/property/units', {
                method: 'GET',
                params: filters
            });
        } catch (error) {
            console.error('Error fetching units:', error);
            throw error;
        }
    }

    async getOwners() {
        try {
            return await apiService.request('/property/owners');
        } catch (error) {
            console.error('Error fetching owners:', error);
            throw error;
        }
    }

    async getTenants() {
        try {
            return await apiService.request('/property/tenants');
        } catch (error) {
            console.error('Error fetching tenants:', error);
            throw error;
        }
    }

    async assignTenantToUnit(unitId, tenantId) {
        try {
            return await apiService.request(`/property/units/${unitId}/assign`, {
                method: 'POST',
                body: JSON.stringify({ tenantId })
            });
        } catch (error) {
            console.error('Error assigning tenant:', error);
            throw error;
        }
    }

    async updateUnitStatus(unitId, status) {
        try {
            return await apiService.request(`/property/units/${unitId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Error updating unit status:', error);
            throw error;
        }
    }
}

export const propertyService = new PropertyService();
