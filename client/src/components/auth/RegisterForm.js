import { authService } from '../../services/auth.service.js';
import { showToast } from '../../utils/helpers.js';
import { validatePassword } from '../../utils/validators.js';

export class RegisterForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
            this.form.querySelector('#password').addEventListener('input', this.validatePasswordStrength.bind(this));
        }
    }

    validatePasswordStrength(e) {
        const password = e.target.value;
        const strengthIndicator = document.getElementById('password-strength');
        const strength = validatePassword(password);
        
        strengthIndicator.className = `password-strength ${strength}`;
        strengthIndicator.textContent = `Password Strength: ${strength}`;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            username: this.form.querySelector('#username').value,
            email: this.form.querySelector('#email').value,
            password: this.form.querySelector('#password').value,
            confirmPassword: this.form.querySelector('#confirm-password').value
        };

        if (formData.password !== formData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            await authService.register(formData);
            showToast('Registration successful! Please login.', 'success');
            window.location.href = '/login.html';
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}
