import { authService } from '../../services/auth.service.js';
import { showToast } from '../../utils/helpers.js';

export class Header {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) return;

        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();

        this.container.innerHTML = `
            <nav class="blue darken-2">
                <div class="nav-wrapper">
                    <a href="/" class="brand-logo">
                        <i class="material-icons">apartment</i>
                        Property Management
                    </a>
                    <a href="#" data-target="mobile-nav" class="sidenav-trigger">
                        <i class="material-icons">menu</i>
                    </a>
                    <ul class="right hide-on-med-and-down">
                        ${this.generateMenuItems(isAuthenticated)}
                    </ul>
                    ${isAuthenticated ? this.generateUserDropdown(user) : ''}
                </div>
            </nav>

            <ul class="sidenav" id="mobile-nav">
                ${this.generateMobileMenuItems(isAuthenticated)}
            </ul>
        `;

        // Initialize Materialize components
        M.Sidenav.init(this.container.querySelectorAll('.sidenav'));
        M.Dropdown.init(this.container.querySelectorAll('.dropdown-trigger'));
    }

    generateMenuItems(isAuthenticated) {
        if (!isAuthenticated) {
            return `
                <li><a href="/login.html">Login</a></li>
                <li><a href="/register.html">Register</a></li>
            `;
        }

        return `
            <li><a href="/dashboard.html">Dashboard</a></li>
            <li><a href="/revenue-management.html">Revenue</a></li>
            <li><a href="/expense-management.html">Expenses</a></li>
            <li><a href="/inventory-management.html">Inventory</a></li>
        `;
    }

    generateMobileMenuItems(isAuthenticated) {
        if (!isAuthenticated) {
            return `
                <li><a href="/login.html">Login</a></li>
                <li><a href="/register.html">Register</a></li>
            `;
        }

        return `
            <li><a href="/dashboard.html">Dashboard</a></li>
            <li><a href="/revenue-management.html">Revenue</a></li>
            <li><a href="/expense-management.html">Expenses</a></li>
            <li><a href="/inventory-management.html">Inventory</a></li>
            <li class="divider"></li>
            <li><a href="/profile.html">Profile</a></li>
            <li><a href="#" class="logout-btn">Logout</a></li>
        `;
    }

    generateUserDropdown(user) {
        return `
            <ul id="user-dropdown" class="dropdown-content">
                <li><a href="/profile.html">Profile</a></li>
                <li><a href="#" class="logout-btn">Logout</a></li>
            </ul>
            <ul class="right">
                <li>
                    <a class="dropdown-trigger" href="#!" data-target="user-dropdown">
                        ${user?.username || 'User'}
                        <i class="material-icons right">arrow_drop_down</i>
                    </a>
                </li>
            </ul>
        `;
    }

    setupEventListeners() {
        // Handle logout
        this.container.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await authService.logout();
                    window.location.href = '/login.html';
                } catch (error) {
                    showToast('Error logging out', 'error');
                }
            });
        });
    }
}
