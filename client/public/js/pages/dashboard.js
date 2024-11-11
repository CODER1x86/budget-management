import { apiService } from '../../../src/services/api.service.js';
import { DashboardSummary } from '../../../src/components/dashboard/DashboardSummary.js';
import { RevenueChart } from '../../../src/components/dashboard/RevenueChart.js';
import { TransactionList } from '../../../src/components/dashboard/TransactionList.js';
import { showToast } from '../../../src/utils/helpers.js';

class DashboardPage {
    constructor() {
        this.summary = new DashboardSummary('summary-cards');
        this.revenueChart = new RevenueChart('revenue-expenses-chart');
        this.transactionList = new TransactionList('recent-transactions');
        
        this.initialize();
    }

    async initialize() {
        try {
            // Load initial data
            const dashboardData = await apiService.getDashboardSummary();
            const transactions = await apiService.getRecentTransactions();

            // Update components
            this.summary.update(dashboardData);
            this.revenueChart.initialize(dashboardData);
            this.transactionList.update(transactions);

            // Setup refresh interval
            this.setupRefreshInterval();
        } catch (error) {
            showToast('Error loading dashboard data', 'error');
            console.error('Dashboard initialization error:', error);
        }
    }

    setupRefreshInterval() {
        // Refresh dashboard data every 5 minutes
        setInterval(async () => {
            try {
                const dashboardData = await apiService.getDashboardSummary();
                this.summary.update(dashboardData);
                this.revenueChart.update(dashboardData);
            } catch (error) {
                console.error('Error refreshing dashboard data:', error);
            }
        }, 300000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardPage();
});
