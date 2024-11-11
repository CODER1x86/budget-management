import { revenueService } from '../../services/revenue.service.js';
import { formatCurrency } from '../../utils/helpers.js';

export class RevenueStats {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
    }

    async loadStats(period = 'monthly') {
        try {
            const stats = await revenueService.getRevenueStats(period);
            this.renderStats(stats);
            this.renderChart(stats);
        } catch (error) {
            showToast('Error loading revenue statistics', 'error');
        }
    }

    renderStats(stats) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="row">
                <div class="col s12 m4">
                    <div class="card-panel">
                        <h5>Total Revenue</h5>
                        <h4>${formatCurrency(stats.total)}</h4>
                    </div>
                </div>
                <div class="col s12 m4">
                    <div class="card-panel">
                        <h5>Average Revenue</h5>
                        <h4>${formatCurrency(stats.average)}</h4>
                    </div>
                </div>
                <div class="col s12 m4">
                    <div class="card-panel">
                        <h5>Growth Rate</h5>
                        <h4>${stats.growthRate}%</h4>
                    </div>
                </div>
            </div>
        `;
    }

    renderChart(stats) {
        const ctx = document.getElementById('revenue-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.labels,
                datasets: [{
                    label: 'Revenue Trend',
                    data: stats.values,
                    borderColor: 'rgba(76, 175, 80, 1)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
}
