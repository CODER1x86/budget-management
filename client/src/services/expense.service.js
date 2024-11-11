import { apiService } from './api.service.js';

class ExpenseService {
    async getExpenseList(filters = {}) {
        return apiService.request('/expenses/list', {
            method: 'GET',
            params: filters
        });
    }

    async addExpense(expenseData) {
        return apiService.request('/expenses/add', {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
    }

    async updateExpense(id, expenseData) {
        return apiService.request(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
    }

    async deleteExpense(id) {
        return apiService.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
    }

    async getExpenseStats(period = 'monthly') {
        return apiService.request(`/expenses/stats/${period}`);
    }

    async getExpenseCategories() {
        return apiService.request('/expenses/categories');
    }

    async exportExpenses(format = 'pdf', filters = {}) {
        return apiService.request('/expenses/export', {
            method: 'POST',
            body: JSON.stringify({ format, filters })
        });
    }
}

export const expenseService = new ExpenseService();
