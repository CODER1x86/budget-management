export const currencyUtils = {
    formatCurrency(amount, currency = 'PHP') {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    parseCurrencyInput(value) {
        return parseFloat(value.replace(/[^\d.-]/g, ''));
    },

    calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue === 0 ? 0 : 100;
        return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
    },

    formatPercentage(value, decimals = 2) {
        return `${value.toFixed(decimals)}%`;
    }
};
