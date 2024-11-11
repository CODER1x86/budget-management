// Utility functions
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
};

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const showToast = (message, type = 'info') => {
    const classes = {
        success: 'green',
        error: 'red',
        warning: 'orange',
        info: 'blue'
    };
    
    M.toast({
        html: message,
        classes: classes[type],
        displayLength: 4000
    });
};
