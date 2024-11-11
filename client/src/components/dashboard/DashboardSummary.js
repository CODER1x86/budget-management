import { formatCurrency } from '../../utils/helpers.js';

export class DashboardSummary {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    update(data) {
        const elements = {
            'total-revenue': data.totalRevenue,
            'total-expenses': data.totalExpenses,
            'net-income': data.netIncome,
            'pending-payments': data.pendingPayments
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = typeof value === 'number' 
                    ? formatCurrency(value)
                    : value;
            }
        });
    }
}
