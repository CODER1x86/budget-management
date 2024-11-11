import { expenseService } from '../../services/expense.service.js';
import { showToast } from '../../utils/helpers.js';

export class ExpenseForm {
    constructor(formId, onSubmitCallback) {
        this.form = document.getElementById(formId);
        this.onSubmitCallback = onSubmitCallback;
        this.setupEventListeners();
        this.initializeMaterialize();
        this.loadCategories();
    }

    async loadCategories() {
        try {
            const categories = await expenseService.getExpenseCategories();
            const categorySelect = this.form.querySelector('#category');
            categorySelect.innerHTML = categories.map(category => 
                `<option value="${category.id}">${category.name}</option>`
            ).join('');
            M.FormSelect.init(categorySelect);
        } catch (error) {
            showToast('Error loading expense categories', 'error');
        }
    }

    initializeMaterialize() {
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
            
            // Add receipt image preview
            const receiptInput = this.form.querySelector('#receipt');
            if (receiptInput) {
                receiptInput.addEventListener('change', this.handleReceiptUpload.bind(this));
            }
        }
    }

    handleReceiptUpload(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('receipt-preview');
        
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const expenseData = {
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            description: formData.get('description'),
            paymentMethod: formData.get('payment-method'),
            receipt: formData.get('receipt')
        };

        try {
            await expenseService.addExpense(expenseData);
            showToast('Expense entry added successfully', 'success');
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
                if (element.tagName === 'SELECT') {
                    M.FormSelect.init(element);
                }
            }
        });
    }
}
