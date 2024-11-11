import { Header } from '../../src/components/layout/Header.js';
import { Footer } from '../../src/components/layout/Footer.js';
import { ConfirmationModal } from '../../src/components/common/ConfirmationModal.js';
import { AlertModal } from '../../src/components/common/AlertModal.js';

// Initialize layout components
document.addEventListener('DOMContentLoaded', () => {
    // Initialize header and footer
    new Header('header-placeholder');
    new Footer('footer-placeholder');

    // Initialize global modals
    window.confirmationModal = new ConfirmationModal('confirmation-modal');
    window.alertModal = new AlertModal('alert-modal');
});
