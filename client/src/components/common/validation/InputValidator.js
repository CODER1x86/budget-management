export class InputValidator {
    constructor(input, rules, options = {}) {
        this.input = input;
        this.rules = rules;
        this.options = {
            validateOnBlur: true,
            validateOnInput: false,
            showErrorsImmediately: true,
            ...options
        };
        this.error = null;
        this.initialize();
    }

    initialize() {
        if (this.options.validateOnBlur) {
            this.input.addEventListener('blur', () => this.validate());
        }

        if (this.options.validateOnInput) {
            this.input.addEventListener('input', () => {
                if (this.options.showErrorsImmediately) {
                    this.validate();
                } else {
                    this.clearError();
                }
            });
        }
    }

    validate() {
        const value = this.input.value;
        this.error = null;

        for (const rule of this.rules) {
            const error = rule(value);
            if (error) {
                this.error = error;
                break;
            }
        }

        this.updateUI();
        return !this.error;
    }

    updateUI() {
        if (this.error) {
            this.input.classList.add('invalid');
            this.showError();
        } else {
            this.input.classList.remove('invalid');
            this.clearError();
        }
    }

    showError() {
        let errorElement = this.getErrorElement();
        errorElement.textContent = this.error;
        errorElement.style.display = 'block';
    }

    clearError() {
        this.error = null;
        let errorElement = this.getErrorElement();
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        this.input.classList.remove('invalid');
    }

    getErrorElement() {
        let errorElement = this.input.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('span');
            errorElement.classList.add('error-message', 'red-text');
            this.input.parentNode.insertBefore(errorElement, this.input.nextSibling);
        }
        return errorElement;
    }

    reset() {
        this.clearError();
        this.input.value = '';
    }

    isValid() {
        return !this.error;
    }

    getError() {
        return this.error;
    }
}
