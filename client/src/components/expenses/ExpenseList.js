import { expenseService } from '../../services/expense.service.js';
import { formatCurrency, formatDate } from '../../utils/helpers.js';

export class ExpenseList {
    constructor(containerId, onEditCallback, onDeleteCallback) {
        this.container = document.getElementById(containerId);
        this.onEditCallback = onEditCallback;
        this.onDeleteCallback = onDeleteCallback;
        this.currentFilters = {};
    }

    async loadData(filters = {}) {
        try {
            this.currentFilters = { ...this.currentFilters, ...filters };
            const data = await expenseService.getExpenseList(this.currentFilters);
            this.render(data);
        } catch (error) {
            showToast('Error loading expense data', 'error');
        }
    }

    render(data) {
        if (!this.container) return;

        this.container.innerHTML = data.map(item => `
            <tr>
                <td>${item.category}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td>${formatDate(item.date)}</td>
                <td>${item.paymentMethod}</td>
                <td>
                    ${item.receipt ? 
                        `<a href="#" class="view-receipt" data-receipt="${item.receipt}">
                            <i class="material-icons">receipt</i>
                        </a>` : 
                        ''}
                </td>
                <td>
                    <button class="btn-small waves-effect waves-light blue edit-btn" 
                            data-id="${item.id}">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small waves-effect waves-light red delete-btn" 
                            data-id="${item.id}">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.onEditCallback) {
                    this.onEditCallback(btn.dataset.id);
                }
            });
        });

        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.onDeleteCallback) {
                    this.onDeleteCallback(btn.dataset.id);
                }
            });
        });

        this.container.querySelectorAll('.view-receipt').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showReceiptModal(link.dataset.receipt);
            });
        });
    }

    showReceiptModal(receiptUrl) {
        const modal = document.getElementById('receipt-modal');
        const image = modal.querySelector('img');
        image.src = receiptUrl;
        M.Modal.getInstance(modal).open();
    }
}
