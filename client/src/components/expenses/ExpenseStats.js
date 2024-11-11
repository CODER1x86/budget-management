import { expenseService } from '../../services/expense.service.js';
import { formatCurrency } from '../../utils/helpers.js';

export class ExpenseStats {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
    }

    async loadStats(period = 'monthly') {
        try {
            const stats = await expenseService.getExpenseStats(period);
            this.renderStats(stats);
            this.renderChart(stats);
        } catch (error) {
            showToast('Error loading expense statistics', 'error');
        }
    }

    renderStats(stats) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="row">
                <div class="col s12 m4">
                    <div class="card-panel">
                        <h5>Total Expenses</h5>
                        <h4>${formatCurrency(stats.total)}</h4>
                    </div>
                </div>
                <div class="col s12 m4">
                    <div class="card-panel">
                        <h5>Average Monthly</h5>
                        <h4>${formatCurrency(stats.average)}</h4>
                    </div>
                </div>
                <div class="col s12 m4">
                    <div class="card-panel">
                        <h5>Largest Category</h5>
                        <h4>${stats.largestCategory}</h4>
                    </div>
                </div>
            </div>
        `;
    }

    renderChart(stats) {
        const ctx = document.getElementById('expense-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: stats.categoryLabels,
                datasets: [{
                    data: stats.categoryValues,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}
