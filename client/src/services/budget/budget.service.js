import { apiService } from '../api.service.js';
import { revenueService } from '../revenue.service.js';
import { expenseService } from '../expense.service.js';
import { showToast } from '../../utils/helpers.js';

class BudgetService {
    async getBudgetSummary(year) {
        try {
            return await apiService.request('/budget/summary', {
                method: 'GET',
                params: { year }
            });
        } catch (error) {
            console.error('Error fetching budget summary:', error);
            throw error;
        }
    }

    async getMonthlyBreakdown(year, month) {
        try {
            return await apiService.request('/budget/monthly-breakdown', {
                method: 'GET',
                params: { year, month }
            });
        } catch (error) {
            console.error('Error fetching monthly breakdown:', error);
            throw error;
        }
    }

    async getYearlyComparison() {
        try {
            return await apiService.request('/budget/yearly-comparison');
        } catch (error) {
            console.error('Error fetching yearly comparison:', error);
            throw error;
        }
    }

    async setBudgetTarget(year, targetData) {
        try {
            return await apiService.request('/budget/target', {
                method: 'POST',
                body: JSON.stringify({ year, ...targetData })
            });
        } catch (error) {
            console.error('Error setting budget target:', error);
            throw error;
        }
    }

    async getBalanceSheet(year) {
        try {
            return await apiService.request('/budget/balance-sheet', {
                method: 'GET',
                params: { year }
            });
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
            throw error;
        }
    }
}

export const budgetService = new BudgetService();
