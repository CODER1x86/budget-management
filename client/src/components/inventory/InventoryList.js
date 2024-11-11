import { inventoryService } from '../../services/inventory/inventory.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { showToast } from '../../utils/helpers.js';

export class InventoryList {
    constructor(containerId, onEditCallback, onDeleteCallback) {
        this.container = document.getElementById(containerId);
        this.onEditCallback = onEditCallback;
        this.onDeleteCallback = onDeleteCallback;
        this.items = [];
        this.setupEventListeners();
    }

    async loadData(filters = {}) {
        try {
            const data = await inventoryService.getInventoryItems(filters);
            this.items = data;
            this.render();
        } catch (error) {
            showToast('Error loading inventory items', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <table class="striped highlight responsive-table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.items.map(item => this.renderItem(item)).join('')}
                </tbody>
            </table>
        `;

        this.setupItemEventListeners();
    }

    renderItem(item) {
        return `
            <tr data-id="${item.id}">
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.quantity * item.unitPrice)}</td>
                <td>
                    <span class="status-badge ${item.quantity > item.minQuantity ? 'green' : 'red'}">
                        ${item.quantity > item.minQuantity ? 'In Stock' : 'Low Stock'}
                    </span>
                </td>
                <td>
                    <button class="btn-small waves-effect waves-light blue edit-btn">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small waves-effect waves-light red delete-btn">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `;
    }

    setupEventListeners() {
        // Global event listeners
    }

    setupItemEventListeners() {
        this.container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('tr').dataset.id;
                const item = this.items.find(item => item.id === id);
                if (item && this.onEditCallback) {
                    this.onEditCallback(item);
                }
            });
        });

        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('tr').dataset.id;
                if (this.onDeleteCallback) {
                    this.onDeleteCallback(id);
                }
            });
        });
    }
}
