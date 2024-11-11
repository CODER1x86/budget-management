export const dateUtils = {
    formatDate(date, format = 'long') {
        const d = new Date(date);
        
        const formats = {
            long: { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            },
            short: { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            },
            time: { 
                hour: '2-digit', 
                minute: '2-digit' 
            },
            full: { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }
        };

        return new Intl.DateTimeFormat('en-US', formats[format]).format(d);
    },

    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return this.formatDate(date, 'short');
        } else if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    },

    getDateRange(period) {
        const now = new Date();
        const start = new Date();
        
        switch (period) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                start.setDate(now.getDate() - 30); // Default to last 30 days
        }
        
        return {
            start: start.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0]
        };
    }
};
