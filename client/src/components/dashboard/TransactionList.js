import { formatCurrency, formatDate } from '../../utils/helpers.js';

export class TransactionList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    update(transactions) {
        if (!this.container) return;

        this.container.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.type}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td>
                    <span class="status-badge status-${transaction.status.toLowerCase()}">
                        ${transaction.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }
}
