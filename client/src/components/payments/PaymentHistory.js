import { paymentService } from '../../services/payments/payment.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { dateUtils } from '../../utils/dateUtils.js';
import { showToast } from '../../utils/helpers.js';

export class PaymentHistory {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.payments = [];
        this.initialize();
    }

    async initialize() {
        await this.loadPayments();
        this.render();
        this.setupEventListeners();
    }

    async loadPayments(filters = {}) {
        try {
            this.payments = await paymentService.getPaymentHistory(filters);
            this.render();
        } catch (error) {
            showToast('Error loading payment history', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <span class="card-title">Payment History</span>
                    <div class="row">
                        <div class="col s12">
                            <table class="striped highlight responsive-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Unit</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Reference</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.payments.map(payment => this.renderPaymentRow(payment)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPaymentRow(payment) {
        return `
            <tr data-payment-id="${payment.id}">
                <td>${dateUtils.formatDate(payment.date)}</td>
                <td>Unit ${payment.unitNumber}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>${payment.methodName}</td>
                <td>${payment.reference}</td>
                <td>
                    <span class="status-badge ${payment.status.toLowerCase()}">
                        ${payment.status}
                    </span>
                </td>
                <td>
                    <button class="btn-small waves-effect waves-light blue view-receipt">
                        <i class="material-icons">receipt</i>
                    </button>
                </td>
            </tr>
        `;
    }

    setupEventListeners() {
        this.container.addEventListener('click', async (e) => {
            const paymentId = e.target.closest('tr')?.dataset.paymentId;
            if (!paymentId) return;

            if (e.target.closest('.view-receipt')) {
                await this.handleViewReceipt(paymentId);
            }
        });
    }

    async handleViewReceipt(paymentId) {
        try {
            const receipt = await paymentService.generateReceipt(paymentId);
            // Implementation for showing receipt (could open in new window or modal)
            window.open(receipt.url, '_blank');
        } catch (error) {
            showToast('Error generating receipt', 'error');
        }
    }
}
