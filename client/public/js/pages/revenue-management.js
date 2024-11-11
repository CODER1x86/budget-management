import { RevenueForm } from '../../../src/components/revenue/RevenueForm.js';
import { RevenueList } from '../../../src/components/revenue/RevenueList.js';
import { RevenueStats } from '../../../src/components/revenue/RevenueStats.js';
import { revenueService } from '../../../src/services/revenue.service.js';
import { showToast } from '../../../src/utils/helpers.js';

class RevenueManagementPage {
    constructor() {
        this.revenueForm = new RevenueForm('revenue-form', () => this.refreshData());
        this.revenueList = new RevenueList('revenue-list', 
            this.handleEdit.bind(this),
            this.handleDelete.bind(this)
        );
        this.revenueStats = new RevenueStats('revenue-stats');
        
        this.initialize();
        this.setupFilterListeners();
    }

    async initialize() {
        await this.refreshData();
        await this.revenueStats.loadStats();
    }

    setupFilterListeners() {
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const filters = {
                    startDate: document.getElementById('start-date').value,
                    endDate: document.getElementById('end-date').value,
                    category: document.getElementById('filter-category').value
                };
                this.revenueList.loadData(filters);
            });
        }
    }

    async refreshData() {
        await this.revenueList.loadData();
        await this.revenueStats.loadStats();
    }

    async handleEdit(id) {
        try {
            const revenueData = await revenueService.getRevenueList({ id });
            this.revenueForm.setFormData(revenueData);
            M.Modal.getInstance(document.getElementById('edit-modal')).open();
        } catch (error) {
            showToast('Error loading revenue data', 'error');
        }
    }

    async handleDelete(id) {
        if (confirm('Are you sure you want to delete this revenue entry?')) {
            try {
                await revenueService.deleteRevenue(id);
                showToast('Revenue entry deleted successfully', 'success');
                await this.refreshData();
            } catch (error) {
                showToast('Error deleting revenue entry', 'error');
            }
        }
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RevenueManagementPage();
});
