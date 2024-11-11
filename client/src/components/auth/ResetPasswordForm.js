import { authService } from '../../services/auth.service.js';
import { showToast } from '../../utils/helpers.js';

export class ResetPasswordForm {
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

        const email = this.form.querySelector('#email').value;

        try {
            await authService.resetPassword(email);
            showToast('Password reset instructions have been sent to your email.', 'success');
            
            // Show success modal if it exists
            const successModal = document.getElementById('success-modal');
            if (successModal) {
                const modal = M.Modal.getInstance(successModal);
                modal.open();
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}
