export class Footer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
    }

    render() {
        if (!this.container) return;

        const currentYear = new Date().getFullYear();

        this.container.innerHTML = `
            <footer class="page-footer blue darken-2">
                <div class="container">
                    <div class="row">
                        <div class="col l6 s12">
                            <h5 class="white-text">Property Management System</h5>
                            <p class="grey-text text-lighten-4">
                                Efficiently manage your property portfolio with our comprehensive management system.
                            </p>
                        </div>
                        <div class="col l4 offset-l2 s12">
                            <h5 class="white-text">Quick Links</h5>
                            <ul>
                                <li><a class="grey-text text-lighten-3" href="/privacy.html">Privacy Policy</a></li>
                                <li><a class="grey-text text-lighten-3" href="/tos.html">Terms of Service</a></li>
                                <li><a class="grey-text text-lighten-3" href="#contact-modal" class="modal-trigger">Contact Us</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="footer-copyright">
                    <div class="container">
                        © ${currentYear} Property Management System
                        <a class="grey-text text-lighten-4 right" href="#!">Version 1.0.0</a>
                    </div>
                </div>
            </footer>
        `;

        // Initialize any Materialize components
        const modals = this.container.querySelectorAll('.modal-trigger');
        M.Modal.init(modals);
    }
}
