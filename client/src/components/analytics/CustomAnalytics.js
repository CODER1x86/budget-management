import { analyticsService } from '../../services/analytics/analytics.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { showToast } from '../../utils/helpers.js';

export class CustomAnalytics {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.initialize();
    }

    initialize() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <span class="card-title">Custom Analytics</span>
                    <div class="row">
                        <div class="col s12">
                            <form id="custom-analytics-form">
                                <div class="row">
                                    <div class="input-field col s12 m4">
                                        <select id="metric-selector" multiple required>
                                            <option value="revenue">Revenue</option>
                                            <option value="expenses">Expenses</option>
                                            <option value="profit">Profit</option>
                                            <option value="inventory">Inventory</option>
                                        </select>
                                        <label>Select Metrics</label>
                                    </div>
                                    <div class="input-field col s12 m4">
                                        <select id="time-period" required>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly" selected>Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                        <label>Time Period</label>
                                    </div>
                                    <div class="input-field col s12 m4">
                                        <select id="chart-type" required>
                                            <option value="line">Line Chart</option>
                                            <option value="bar">Bar Chart</option>
                                            <option value="pie">Pie Chart</option>
                                        </select>
                                        <label>Chart Type</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="input-field col s12 m6">
                                        <input type="text" id="custom-start-date" class="datepicker" required>
                                        <label for="custom-start-date">Start Date</label>
                                    </div>
                                    <div class="input-field col s12 m6">
                                        <input type="text" id="custom-end-date" class="datepicker" required>
                                        <label for="custom-end-date">End Date</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col s12">
                                        <button class="btn waves-effect waves-light" type="submit">
                                            Generate Analytics
                                            <i class="material-icons right">analytics</i>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col s12">
                            <canvas id="custom-analytics-chart"></canvas>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col s12">
                            <table id="analytics-table" class="striped highlight responsive-table" style="display: none;">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <!-- Dynamic headers will be added here -->
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Data rows will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize Materialize components
        M.FormSelect.init(this.container.querySelectorAll('select'));
        M.Datepicker.init(this.container.querySelectorAll('.datepicker'), {
            format: 'yyyy-mm-dd',
            autoClose: true
        });
    }

    setupEventListeners() {
        const form = this.container.querySelector('#custom-analytics-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.generateCustomAnalytics();
            });
        }
    }

    async generateCustomAnalytics() {
        try {
            const config = this.getAnalyticsConfig();
            const data = await analyticsService.getCustomReport(config);
            this.updateChart(data);
            this.updateTable(data);
        } catch (error) {
            showToast('Error generating custom analytics', 'error');
        }
    }

    getAnalyticsConfig() {
        return {
            metrics: Array.from(this.container.querySelector('#metric-selector').selectedOptions)
                .map(option => option.value),
            timePeriod: this.container.querySelector('#time-period').value,
            chartType: this.container.querySelector('#chart-type').value,
            startDate: this.container.querySelector('#custom-start-date').value,
            endDate: this.container.querySelector('#custom-end-date').value
        };
    }

    updateChart(data) {
        const ctx = this.container.querySelector('#custom-analytics-chart').getContext('2d');
        const chartType = this.container.querySelector('#chart-type').value;
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: data.metrics.map((metric, index) => ({
                    label: metric.name,
                    data: metric.values,
                    borderColor: this.getChartColor(index),
                    backgroundColor: this.getChartColor(index, 0.2),
                    borderWidth: 2,
                    tension: 0.4
                }))
            },
            options: this.getChartOptions(chartType)
        });
    }

    updateTable(data) {
        const table = this.container.querySelector('#analytics-table');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');

        // Update headers
        thead.innerHTML = `
            <th>Period</th>
            ${data.metrics.map(metric => `<th>${metric.name}</th>`).join('')}
        `;

        // Update rows
        tbody.innerHTML = data.labels.map((label, index) => `
            <tr>
                <td>${label}</td>
                ${data.metrics.map(metric => `
                    <td>${this.formatMetricValue(metric.values[index], metric.type)}</td>
                `).join('')}
            </tr>
        `).join('');

        table.style.display = 'table';
    }

    getChartColor(index, alpha = 1) {
        const colors = [
            `rgba(76, 175, 80, ${alpha})`,  // Green
            `rgba(33, 150, 243, ${alpha})`, // Blue
            `rgba(255, 152, 0, ${alpha})`,  // Orange
            `rgba(156, 39, 176, ${alpha})`, // Purple
            `rgba(244, 67, 54, ${alpha})`   // Red
        ];
        return colors[index % colors.length];
    }

    getChartOptions(chartType) {
        const baseOptions = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Custom Analytics'
                }
            }
        };

        if (chartType === 'pie') {
            return baseOptions;
        }

        return {
            ...baseOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => this.formatMetricValue(value)
                    }
                }
            }
        };
    }

    formatMetricValue(value, type = 'currency') {
        switch (type) {
            case 'currency':
                return formatCurrency(value);
            case 'percentage':
                return `${value.toFixed(2)}%`;
            case 'number':
                return value.toLocaleString();
            default:
                return value;
        }
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}
