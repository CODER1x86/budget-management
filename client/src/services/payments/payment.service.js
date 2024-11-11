import { apiService } from '../api.service.js';
import { showToast } from '../../utils/helpers.js';

class PaymentService {
    async getPaymentMethods() {
        try {
            return await apiService.request('/payments/methods');
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            throw error;
        }
    }

    async processPayment(paymentData) {
        try {
            return await apiService.request('/payments/process', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
        } catch (error) {
            console.error('Error processing payment:', error);
            throw error;
        }
    }

    async getPaymentHistory(filters = {}) {
        try {
            return await apiService.request('/payments/history', {
                method: 'GET',
                params: filters
            });
        } catch (error) {
            console.error('Error fetching payment history:', error);
            throw error;
        }
    }

    async generateReceipt(paymentId) {
        try {
            return await apiService.request(`/payments/${paymentId}/receipt`, {
                method: 'GET'
            });
        } catch (error) {
            console.error('Error generating receipt:', error);
            throw error;
        }
    }

    async updatePaymentStatus(paymentId, status) {
        try {
            return await apiService.request(`/payments/${paymentId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }
}

export const paymentService = new PaymentService();
