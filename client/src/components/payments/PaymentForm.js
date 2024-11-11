import { paymentService } from '../../services/payments/payment.service.js';
import { propertyService } from '../../services/property/property.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { showToast } from '../../utils/helpers.js';

export class PaymentForm {
    constructor(containerId, onSubmitCallback) {
        this.container = document.getElementById(containerId);
        this.onSubmitCallback = onSubmitCallback;
        this.paymentMethods = [];
        this.units = [];
        this.initialize();
    }

    async initialize() {
        await Promise.all([
            this.loadPaymentMethods(),
            this.loadUnits()
        ]);
        this.render();
        this.setupEventListeners();
    }

    async loadPaymentMethods() {
        try {
            this.paymentMethods = await paymentService.getPaymentMethods();
        } catch (error) {
            showToast('Error loading payment methods', 'error');
        }
    }

    async loadUnits() {
        try {
            this.units = await propertyService.getUnits();
        } catch (error) {
            showToast('Error loading units', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <span class="card-title">Process Payment</span>
                    <form id="payment-form">
                        <div class="row">
                            <div class="input-field col s12 m6">
                                <select id="unit-select" required>
                                    <option value="" disabled selected>Choose unit</option>
                                    ${this.units.map(unit => 
                                        `<option value="${unit.id}">Unit ${unit.unitNumber}</option>`
                                    ).join('')}
                                </select>
                                <label>Unit</label>
                            </div>
                            <div class="input-field col s12 m6">
                                <select id="payment-method" required>
                                    <option value="" disabled selected>Choose payment method</option>
                                    ${this.paymentMethods.map(method => 
                                        `<option value="${method.id}">${method.name}</option>`
                                    ).join('')}
                                </select>
                                <label>Payment Method</label>
                            </div>
                        </div>
                        <div class="row">
                            <div class="input-field col s12 m6">
                                <input type="number" id="amount" required min="0" step="0.01">
                                <label for="amount">Amount</label>
                            </div>
                            <div class="input-field col s12 m6">
                                <input type="text" id="reference" required>
                                <label for="reference">Reference Number</label>
                            </div>
                        </div>
                        <div class="row">
                            <div class="input-field col s12">
                                <textarea id="notes" class="materialize-textarea"></textarea>
                                <label for="notes">Notes</label>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col s12">
                                <button class="btn waves-effect waves-light" type="submit">
                                    Process Payment
                                    <i class="material-icons right">send</i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Initialize Materialize components
        M.FormSelect.init(this.container.querySelectorAll('select'));
        M.TextareaMaterialize.init(this.container.querySelectorAll('.materialize-textarea'));
    }

    setupEventListeners() {
        const form = this.container.querySelector('#payment-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = {
            unitId: this.container.querySelector('#unit-select').value,
            methodId: this.container.querySelector('#payment-method').value,
            amount: parseFloat(this.container.querySelector('#amount').value),
            reference: this.container.querySelector('#reference').value,
            notes: this.container.querySelector('#notes').value
        };

        try {
            const response = await paymentService.processPayment(formData);
            showToast('Payment processed successfully', 'success');
            
            if (this.onSubmitCallback) {
                this.onSubmitCallback(response);
            }

            // Reset form
            event.target.reset();
        } catch (error) {
            showToast('Error processing payment', 'error');
        }
    }
}
