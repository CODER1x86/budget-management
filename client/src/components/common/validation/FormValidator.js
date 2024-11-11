import { validationUtils } from '../../../utils/validationUtils.js';

export class FormValidator {
    constructor(form, rules, options = {}) {
        this.form = form;
        this.rules = rules;
        this.options = {
            validateOnBlur: true,
            validateOnSubmit: true,
            showErrorsImmediately: true,
            ...options
        };
        this.errors = new Map();
        this.initialize();
    }

    initialize() {
        if (this.options.validateOnBlur) {
            this.setupFieldValidation();
        }

        if (this.options.validateOnSubmit) {
            this.setupFormValidation();
        }
    }

    setupFieldValidation() {
        Object.keys(this.rules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });

                if (this.options.showErrorsImmediately) {
                    field.addEventListener('input', () => {
                        this.validateField(field);
                    });
                }
            }
        });
    }

    setupFormValidation() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value;
        const rules = this.rules[fieldName];

        if (!rules) return true;

        let error = null;

        // Required check
        if (rules.required && !value) {
            error = 'This field is required';
        }
        // Minimum length check
        else if (rules.minLength && value.length < rules.minLength) {
            error = `Minimum length is ${rules.minLength} characters`;
        }
        // Maximum length check
        else if (rules.maxLength && value.length > rules.maxLength) {
            error = `Maximum length is ${rules.maxLength} characters`;
        }
        // Pattern check
        else if (rules.pattern && !rules.pattern.test(value)) {
            error = rules.message || 'Invalid format';
        }
        // Custom validation
        else if (rules.custom) {
            error = rules.custom(value, this.getFormData());
        }

        this.setFieldError(field, error);
        return !error;
    }

    validateForm() {
        let isValid = true;
        const formData = this.getFormData();

        Object.keys(this.rules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    setFieldError(field, error) {
        const errorElement = this.getErrorElement(field);
        
        if (error) {
            this.errors.set(field.name, error);
            field.classList.add('invalid');
            if (errorElement) {
                errorElement.textContent = error;
                errorElement.style.display = 'block';
            }
        } else {
            this.errors.delete(field.name);
            field.classList.remove('invalid');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }
    }

    getErrorElement(field) {
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('span');
            errorElement.classList.add('error-message', 'red-text');
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        return errorElement;
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    reset() {
        this.errors.clear();
        this.form.reset();
        this.form.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        this.form.querySelectorAll('.invalid').forEach(field => {
            field.classList.remove('invalid');
        });
    }

    hasErrors() {
        return this.errors.size > 0;
    }

    getErrors() {
        return Object.fromEntries(this.errors);
    }
}
