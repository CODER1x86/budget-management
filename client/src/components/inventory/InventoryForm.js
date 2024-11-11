import { inventoryService } from '../../services/inventory/inventory.service.js';
import { validationUtils } from '../../utils/validationUtils.js';
import { showToast } from '../../utils/helpers.js';

export class InventoryForm {
    constructor(formId, onSubmitCallback) {
        this.form = document.getElementById(formId);
        this.onSubmitCallback = onSubmitCallback;
        this.categories = [];
        this.initialize();
    }

    async initialize() {
        await this.loadCategories();
        this.setupEventListeners();
        this.initializeMaterialize();
    }

    async loadCategories() {
        try {
            this.categories = await inventoryService.getInventoryCategories();
            this.populateCategorySelect();
        } catch (error) {
            showToast('Error loading categories', 'error');
        }
    }

    populateCategorySelect() {
        const categorySelect = this.form.querySelector('#category');
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="" disabled selected>Choose category</option>
                ${this.categories.map(category => 
                    `<option value="${category.id}">${category.name}</option>`
                ).join('')}
            `;
            M.FormSelect.init(categorySelect);
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
            
            // Real-time validation
            this.form.querySelectorAll('input').forEach(input => {
                input.addEventListener('blur', this.validateField.bind(this));
            });
        }
    }

    validateField(event) {
        const field = event.target;
        const value = field.value;
        const name = field.name;
        
        const rules = {
            name: { required: true, minLength: 3 },
            quantity: { required: true, min: 0 },
            unitPrice: { required: true, min: 0 },
            minQuantity: { required: true, min: 0 },
            category: { required: true }
        };

        const fieldRules = rules[name];
        if (fieldRules) {
            const error = this.validateSingleField(value, fieldRules);
            this.showFieldError(field, error);
        }
    }

    validateSingleField(value, rules) {
        if (rules.required && !value) {
            return 'This field is required';
        }
        if (rules.minLength && value.length < rules.minLength) {
            return `Minimum length is ${rules.minLength} characters`;
        }
        if (rules.min !== undefined && Number(value) < rules.min) {
            return `Minimum value is ${rules.min}`;
        }
        return null;
    }

    showFieldError(field, error) {
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = error || '';
            field.classList.toggle('invalid', !!error);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const itemData = {
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: parseInt(formData.get('quantity')),
            unitPrice: parseFloat(formData.get('unitPrice')),
            minQuantity: parseInt(formData.get('minQuantity')),
            description: formData.get('description')
        };

        const validation = validationUtils.validateForm(itemData, {
            name: { required: true, minLength: 3 },
            category: { required: true },
            quantity: { required: true, min: 0 },
            unitPrice: { required: true, min: 0 },
            minQuantity: { required: true, min: 0 }
        });

        if (!validation.isValid) {
            Object.entries(validation.errors).forEach(([field, error]) => {
                const element = this.form.querySelector(`[name="${field}"]`);
                this.showFieldError(element, error);
            });
            return;
        }

        try {
            const isEdit = !!this.form.dataset.itemId;
            let response;

            if (isEdit) {
                response = await inventoryService.updateInventoryItem(
                    this.form.dataset.itemId,
                    itemData
                );
                showToast('Item updated successfully', 'success');
            } else {
                response = await inventoryService.addInventoryItem(itemData);
                showToast('Item added successfully', 'success');
            }

            this.form.reset();
            if (this.onSubmitCallback) {
                this.onSubmitCallback(response);
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    setFormData(item) {
        this.form.dataset.itemId = item.id;
        Object.entries(item).forEach(([key, value]) => {
            const element = this.form.querySelector(`[name="${key}"]`);
            if (element) {
                element.value = value;
                if (element.tagName === 'SELECT') {
                    M.FormSelect.init(element);
                }
            }
        });
    }

    reset() {
        delete this.form.dataset.itemId;
        this.form.reset();
        this.form.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        this.form.querySelectorAll('.invalid').forEach(field => {
            field.classList.remove('invalid');
        });
    }
}
