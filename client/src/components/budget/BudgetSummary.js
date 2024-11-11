import { budgetService } from '../../services/budget/budget.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { showToast } from '../../utils/helpers.js';
import Chart from 'chart.js';

export class BudgetSummary {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentYear = new Date().getFullYear();
        this.summaryData = null;
        this.charts = {};
        this.initialize();
    }

    async initialize() {
        await this.loadBudgetSummary();
        this.render();
        this.setupEventListeners();
    }

    async loadBudgetSummary() {
        try {
            this.summaryData = await budgetService.getBudgetSummary(this.currentYear);
        } catch (error) {
            showToast('Error loading budget summary', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="row">
                <div class="col s12">
                    <div class="card">
                        <div class="card-content">
                            <span class="card-title">Budget Summary ${this.currentYear}</span>
                            <div class="row">
                                <div class="col s12 m4">
                                    <div class="summary-box">
                                        <h5>Total Revenue</h5>
                                        <h4 class="green-text">${formatCurrency(this.summaryData.totalRevenue)}</h4>
                                    </div>
                                </div>
                                <div class="col s12 m4">
                                    <div class="summary-box">
                                        <h5>Total Expenses</h5>
                                        <h4 class="red-text">${formatCurrency(this.summaryData.totalExpenses)}</h4>
                                    </div>
                                </div>
                                <div class="col s12 m4">
                                    <div class="summary-box">
                                        <h5>Net Balance</h5>
                                        <h4 class="${this.summaryData.netBalance >= 0 ? 'green-text' : 'red-text'}">
                                            ${formatCurrency(this.summaryData.netBalance)}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col s12 m6">
                                    <canvas id="monthly-comparison-chart"></canvas>
                                </div>
                                <div class="col s12 m6">
                                    <canvas id="category-breakdown-chart"></canvas>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col s12">
                                    <h5>Budget Targets</h5>
                                    <div class="progress-container">
                                        ${this.renderBudgetTargets()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeCharts();
    }

    renderBudgetTargets() {
        return this.summaryData.targets.map(target => `
            <div class="target-item">
                <div class="target-label">
                    <span>${target.category}</span>
                    <span>${formatCurrency(target.current)} / ${formatCurrency(target.target)}</span>
                </div>
                <div class="progress">
                    <div class="determinate" style="width: ${(target.current / target.target) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        this.initializeMonthlyComparisonChart();
        this.initializeCategoryBreakdownChart();
    }

    initializeMonthlyComparisonChart() {
        const ctx = document.getElementById('monthly-comparison-chart').getContext('2d');
        this.charts.monthlyComparison = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.summaryData.monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Revenue',
                        data: this.summaryData.monthlyData.map(d => d.revenue),
                        borderColor: 'rgba(76, 175, 80, 1)',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: this.summaryData.monthlyData.map(d => d.expenses),
                        borderColor: 'rgba(244, 67, 54, 1)',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Revenue vs Expenses'
                    }
                },
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

    initializeCategoryBreakdownChart() {
        const ctx = document.getElementById('category-breakdown-chart').getContext('2d');
        this.charts.categoryBreakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.summaryData.categoryBreakdown.map(c => c.category),
                datasets: [{
                    data: this.summaryData.categoryBreakdown.map(c => c.amount),
                    backgroundColor: [
                        '#4CAF50',
                        '#2196F3',
                        '#FF9800',
                        '#F44336',
                        '#9C27B0'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expense Categories'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    setupEventListeners() {
        // Add year selector if needed
        const yearSelector = this.container.querySelector('#year-selector');
        if (yearSelector) {
            yearSelector.addEventListener('change', async (e) => {
                this.currentYear = parseInt(e.target.value);
                await this.loadBudgetSummary();
                this.render();
            });
        }
    }

    destroy() {
        // Cleanup charts when component is destroyed
        Object.values(this.charts).forEach(chart => chart.destroy());
    }
}
