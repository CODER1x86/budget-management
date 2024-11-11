import { Modal } from './Modal.js';

export class ConfirmationModal extends Modal {
    constructor(id, options = {}) {
        super(id, options);
        this.onConfirm = options.onConfirm || (() => {});
        this.onCancel = options.onCancel || (() => {});
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.modal) {
            const confirmBtn = this.modal.querySelector('.confirm-btn');
            const cancelBtn = this.modal.querySelector('.cancel-btn');

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.onConfirm();
                    this.close();
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.onCancel();
                    this.close();
                });
            }
        }
    }

    show(message, title = 'Confirm Action') {
        this.updateContent(`
            <div class="modal-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-close waves-effect waves-light btn-flat cancel-btn">Cancel</button>
                <button class="waves-effect waves-light btn red confirm-btn">Confirm</button>
            </div>
        `);
        this.open();
    }
}
