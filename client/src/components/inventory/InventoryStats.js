import { inventoryService } from '../../services/inventory/inventory.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { showToast } from '../../utils/helpers.js';

export class InventoryStats {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.initialize();
    }

    async initialize() {
        try {
            const stats = await inventoryService.getInventoryStats();
            this.render(stats);
            this.renderCharts(stats);
        } catch (error) {
            showToast('Error loading inventory statistics', 'error');
        }
    }

    render(stats) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="row">
                <div class="col s12 m3">
                    <div class="card-panel">
                        <h5>Total Items</h5>
                        <h4>${stats.totalItems}</h4>
                    </div>
                </div>
                <div class="col s12 m3">
                    <div class="card-panel">
                        <h5>Total Value</h5>
                        <h4>${formatCurrency(stats.totalValue)}</h4>
                    </div>
                </div>
                <div class="col s12 m3">
                    <div class="card-panel">
                        <h5>Low Stock Items</h5>
                        <h4>${stats.lowStockItems}</h4>
                    </div>
                </div>
                <div class="col s12 m3">
                    <div class="card-panel">
                        <h5>Out of Stock</h5>
                        <h4>${stats.outOfStockItems}</h4>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col s12 m6">
                    <div class="card">
                        <div class="card-content">
                            <span class="card-title">Category Distribution</span>
                            <canvas id="category-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col s12 m6">
                    <div class="card">
                        <div class="card-content">
                            <span class="card-title">Value Distribution</span>
                            <canvas id="value-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCharts(stats) {
        this.renderCategoryChart(stats.categoryDistribution);
        this.renderValueChart(stats.valueDistribution);
    }

    renderCategoryChart(distribution) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distribution.map(d => d.category),
                datasets: [{
                    data: distribution.map(d => d.count),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    renderValueChart(distribution) {
        const ctx = document.getElementById('value-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: distribution.map(d => d.category),
                datasets: [{
                    label: 'Total Value',
                    data: distribution.map(d => d.value),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
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
