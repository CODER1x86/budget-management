import { revenueService } from '../../services/revenue.service.js';
import { showToast } from '../../utils/helpers.js';

export class RevenueForm {
    constructor(formId, onSubmitCallback) {
        this.form = document.getElementById(formId);
        this.onSubmitCallback = onSubmitCallback;
        this.setupEventListeners();
        this.initializeMaterialize();
    }

    initializeMaterialize() {
        // Initialize Materialize select and datepicker
        const selects = this.form.querySelectorAll('select');
        M.FormSelect.init(selects);

        const datepickers = this.form.querySelectorAll('.datepicker');
        M.Datepicker.init(datepickers, {
            format: 'yyyy-mm-dd',
            autoClose: true
        });
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            category: this.form.querySelector('#category').value,
            amount: parseFloat(this.form.querySelector('#amount').value),
            date: this.form.querySelector('#date').value,
            description: this.form.querySelector('#description').value,
            paymentMethod: this.form.querySelector('#payment-method').value
        };

        try {
            await revenueService.addRevenue(formData);
            showToast('Revenue entry added successfully', 'success');
            this.form.reset();
            if (this.onSubmitCallback) this.onSubmitCallback();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            const element = this.form.querySelector(`#${key}`);
            if (element) {
                element.value = value;
                // Trigger Materialize update for select fields
                if (element.tagName === 'SELECT') {
                    M.FormSelect.init(element);
                }
            }
        });
    }
}
