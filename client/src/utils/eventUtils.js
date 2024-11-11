export const eventUtils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    createCustomEvent(eventName, detail = {}) {
        return new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail
        });
    },

    dispatchCustomEvent(element, eventName, detail = {}) {
        const event = this.createCustomEvent(eventName, detail);
        element.dispatchEvent(event);
    }
};
