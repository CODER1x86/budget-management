// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.AutoInit();
    
    // Load header and footer
    loadComponent('header-placeholder', '/header.html');
    loadComponent('footer-placeholder', '/footer.html');
    
    // Setup global event listeners
    setupGlobalListeners();
    
    // Initialize page-specific functionality
    initializePage();
});

// Load header and footer components
function loadComponent(elementId, url) {
    const element = document.getElementById(elementId);
    if (element) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                element.innerHTML = html;
                // Reinitialize Materialize components in loaded content
                M.AutoInit();
            })
            .catch(error => console.error('Error loading component:', error));
    }
}

// Setup global event listeners
function setupGlobalListeners() {
    // Logout handler
    document.addEventListener('click', function(e) {
        if (e.target.matches('#logout-btn')) {
            handleLogout(e);
        }
    });

    // Global search handler
    const searchInput = document.querySelector('.global-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleGlobalSearch, 300));
    }
}

// Initialize page-specific functionality
function initializePage() {
    const currentPage = window.location.pathname;
    
    switch(currentPage) {
        case '/dashboard.html':
            initializeDashboard();
            break;
        case '/revenue-management.html':
            initializeRevenue();
            break;
        case '/expense-management.html':
            initializeExpenses();
            break;
        case '/inventory-management.html':
            initializeInventory();
            break;
        // Add more page initializations as needed
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// API Handlers
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    try {
        const response = await fetch(`/api${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        showError(error.message);
        throw error;
    }
}

// Error Handling
function showError(message) {
    M.toast({
        html: message,
        classes: 'red',
        displayLength: 4000
    });
}

function showSuccess(message) {
    M.toast({
        html: message,
        classes: 'green',
        displayLength: 3000
    });
}

// Authentication Handlers
async function handleLogout(e) {
    e.preventDefault();
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout Error:', error);
    }
}

// Create auth.js for authentication-related functionality
cat > client/public/js/auth.js << 'EOL'
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    M.AutoInit();
    
    // Setup form handlers
    setupAuthForms();
});

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        localStorage.setItem('token', response.token);
        window.location.href = '/dashboard.html';
    } catch (error) {
        showError('Login failed. Please check your credentials.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        showSuccess('Registration successful! Please login.');
        window.location.href = '/login.html';
    } catch (error) {
        showError('Registration failed. Please try again.');
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    try {
        await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        showSuccess('Password reset instructions have been sent to your email.');
        const modal = document.getElementById('success-modal');
        M.Modal.getInstance(modal).open();
    } catch (error) {
        showError('Password reset request failed. Please try again.');
    }
}

// Password validation
function validatePassword(password) {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    
    return password.length >= minLength && hasNumber && hasSymbol && hasUpperCase;
}
