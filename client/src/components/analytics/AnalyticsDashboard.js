import { analyticsService } from '../../services/analytics/analytics.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { dateUtils } from '../../utils/dateUtils.js';
import { showToast } from '../../utils/helpers.js';

export class AnalyticsDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = new Map();
        this.initialize();
    }

    async initialize() {
        this.render();
        await this.loadData();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="row">
                <div class="col s12">
                    <div class="card">
                        <div class="card-content">
                            <span class="card-title">Analytics Dashboard</span>
                            <div class="row">
                                <div class="input-field col s12 m6">
                                    <select id="period-selector">
                                        <option value="week">Last Week</option>
                                        <option value="month" selected>Last Month</option>
                                        <option value="quarter">Last Quarter</option>
                                        <option value="year">Last Year</option>
                                    </select>
                                    <label>Time Period</label>
                                </div>
                                <div class="col s12 m6">
                                    <button class="btn waves-effect waves-light right" id="export-btn">
                                        <i class="material-icons left">file_download</i>
                                        Export Report
                                    </button>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col s12 m3">
                                    <div class="card-panel">
                                        <h5>Total Revenue</h5>
                                        <h4 id="total-revenue">Loading...</h4>
                                    </div>
                                </div>
                                <div class="col s12 m3">
                                    <div class="card-panel">
                                        <h5>Total Expenses</h5>
                                        <h4 id="total-expenses">Loading...</h4>
                                    </div>
                                </div>
                                <div class="col s12 m3">
                                    <div class="card-panel">
                                        <h5>Net Profit</h5>
                                        <h4 id="net-profit">Loading...</h4>
                                    </div>
                                </div>
                                <div class="col s12 m3">
                                    <div class="card-panel">
                                        <h5>Profit Margin</h5>
                                        <h4 id="profit-margin">Loading...</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col s12">
                                    <canvas id="revenue-trend-chart"></canvas>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col s12 m6">
                                    <canvas id="expense-category-chart"></canvas>
                                </div>
                                <div class="col s12 m6">
                                    <canvas id="inventory-value-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize Materialize components
        M.FormSelect.init(this.container.querySelectorAll('select'));
    }

    async loadData(period = 'month') {
        try {
            const metrics = await analyticsService.getDashboardMetrics(period);
            this.updateMetrics(metrics);
            this.updateCharts(metrics);
        } catch (error) {
            showToast('Error loading analytics data', 'error');
        }
    }

    updateMetrics(metrics) {
        document.getElementById('total-revenue').textContent = formatCurrency(metrics.totalRevenue);
        document.getElementById('total-expenses').textContent = formatCurrency(metrics.totalExpenses);
        document.getElementById('net-profit').textContent = formatCurrency(metrics.netProfit);
        document.getElementById('profit-margin').textContent = `${metrics.profitMargin.toFixed(2)}%`;
    }

    updateCharts(metrics) {
        this.updateRevenueTrendChart(metrics.revenueTrend);
        this.updateExpenseCategoryChart(metrics.expensesByCategory);
        this.updateInventoryValueChart(metrics.inventoryValue);
    }

    updateRevenueTrendChart(data) {
        const ctx = document.getElementById('revenue-trend-chart').getContext('2d');
        
        if (this.charts.has('revenueTrend')) {
            this.charts.get('revenueTrend').destroy();
        }

        this.charts.set('revenueTrend', new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: data.revenue,
                        borderColor: 'rgba(76, 175, 80, 1)',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses,
                        borderColor: 'rgba(244, 67, 54, 1)',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4
                    }
                ]
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
        }));
    }

    updateExpenseCategoryChart(data) {
        const ctx = document.getElementById('expense-category-chart').getContext('2d');
        
        if (this.charts.has('expenseCategory')) {
            this.charts.get('expenseCategory').destroy();
        }

        this.charts.set('expenseCategory', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
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
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category'
                    }
                }
            }
        }));
    }

    updateInventoryValueChart(data) {
        const ctx = document.getElementById('inventory-value-chart').getContext('2d');
        
        if (this.charts.has('inventoryValue')) {
            this.charts.get('inventoryValue').destroy();
        }

        this.charts.set('inventoryValue', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Inventory Value',
                    data: data.values,
                    backgroundColor: 'rgba(33, 150, 243, 0.5)',
                    borderColor: 'rgba(33, 150, 243, 1)',
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
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Inventory Value by Category'
                    }
                }
            }
        }));
    }

    setupEventListeners() {
        const periodSelector = this.container.querySelector('#period-selector');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.loadData(e.target.value);
            });
        }

        const exportBtn = this.container.querySelector('#export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const period = this.container.querySelector('#period-selector').value;
                    await analyticsService.exportData('pdf', { period });
                    showToast('Report exported successfully', 'success');
                } catch (error) {
                    showToast('Error exporting report', 'error');
                }
            });
        }
    }

    destroy() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }
}
