import { revenueService } from '../../services/revenue.service.js';
import { formatCurrency, formatDate } from '../../utils/helpers.js';

export class RevenueList {
    constructor(containerId, onEditCallback, onDeleteCallback) {
        this.container = document.getElementById(containerId);
        this.onEditCallback = onEditCallback;
        this.onDeleteCallback = onDeleteCallback;
        this.currentFilters = {};
    }

    async loadData(filters = {}) {
        try {
            this.currentFilters = { ...this.currentFilters, ...filters };
            const data = await revenueService.getRevenueList(this.currentFilters);
            this.render(data);
        } catch (error) {
            showToast('Error loading revenue data', 'error');
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
    }
}
