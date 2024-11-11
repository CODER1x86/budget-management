import { Modal } from './Modal.js';

export class AlertModal extends Modal {
    constructor(id, options = {}) {
        super(id, options);
    }

    show(message, type = 'info') {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const colors = {
            success: 'green-text',
            error: 'red-text',
            warning: 'orange-text',
            info: 'blue-text'
        };

        this.updateContent(`
            <div class="modal-content center-align">
                <i class="material-icons large ${colors[type]}">${icons[type]}</i>
                <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-close waves-effect waves-light btn-flat">Close</button>
            </div>
        `);
        this.open();
    }
}
