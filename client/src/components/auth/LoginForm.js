import { authService } from '../../services/auth.service.js';
import { showToast } from '../../utils/helpers.js';

export class LoginForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const username = this.form.querySelector('#username').value;
        const password = this.form.querySelector('#password').value;

        try {
            await authService.login({ username, password });
            showToast('Login successful!', 'success');
            window.location.href = '/dashboard.html';
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}
