export class Modal {
    constructor(id, options = {}) {
        this.modal = document.getElementById(id);
        this.instance = null;
        this.options = {
            dismissible: true,
            opacity: 0.5,
            inDuration: 250,
            outDuration: 250,
            onOpenStart: null,
            onOpenEnd: null,
            onCloseStart: null,
            onCloseEnd: null,
            ...options
        };
        this.initialize();
    }

    initialize() {
        if (this.modal) {
            this.instance = M.Modal.init(this.modal, this.options);
        }
    }

    open() {
        if (this.instance) {
            this.instance.open();
        }
    }

    close() {
        if (this.instance) {
            this.instance.close();
        }
    }

    updateContent(content) {
        if (this.modal) {
            const contentContainer = this.modal.querySelector('.modal-content');
            if (contentContainer) {
                contentContainer.innerHTML = content;
            }
        }
    }

    destroy() {
        if (this.instance) {
            this.instance.destroy();
        }
    }
}
