import { ExpenseForm } from '../../../src/components/expenses/ExpenseForm.js';
import { ExpenseList } from '../../../src/components/expenses/ExpenseList.js';
import { ExpenseStats } from '../../../src/components/expenses/ExpenseStats.js';
import { expenseService } from '../../../src/services/expense.service.js';
import { showToast } from '../../../src/utils/helpers.js';

class ExpenseManagementPage {
    constructor() {
        this.expenseForm = new ExpenseForm('expense-form', () => this.refreshData());
        this.expenseList = new ExpenseList('expense-list', 
            this.handleEdit.bind(this),
            this.handleDelete.bind(this)
        );
        this.expenseStats = new ExpenseStats('expense-stats');
        
        this.initialize();
        this.setupFilterListeners();
        this.setupExportListeners();
    }

    async initialize() {
        await this.refreshData();
        await this.expenseStats.loadStats();
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
                this.expenseList.loadData(filters);
            });
        }
    }

    setupExportListeners() {
        const exportButtons = {
            'export-pdf': 'pdf',
            'export-excel': 'excel'
        };

        Object.entries(exportButtons).forEach(([id, format]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => this.handleExport(format));
            }
        });
    }

    async refreshData() {
        await this.expenseList.loadData();
        await this.expenseStats.loadStats();
    }

    async handleEdit(id) {
        try {
            const expenseData = await expenseService.getExpenseList({ id });
            this.expenseForm.setFormData(expenseData);
            M.Modal.getInstance(document.getElementById('edit-modal')).open();
        } catch (error) {
            showToast('Error loading expense data', 'error');
        }
    }

    async handleDelete(id) {
        if (confirm('Are you sure you want to delete this expense entry?')) {
            try {
                await expenseService.deleteExpense(id);
                showToast('Expense entry deleted successfully', 'success');
                await this.refreshData();
            } catch (error) {
                showToast('Error deleting expense entry', 'error');
            }
        }
    }

    async handleExport(format) {
        try {
            const filters = {
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                category: document.getElementById('filter-category').value
            };
            
            await expenseService.exportExpenses(format, filters);
            showToast(`Expenses exported as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            showToast('Error exporting expenses', 'error');
        }
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ExpenseManagementPage();
});
