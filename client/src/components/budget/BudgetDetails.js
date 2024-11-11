import { budgetService } from '../../services/budget/budget.service.js';
import { formatCurrency } from '../../utils/currencyUtils.js';
import { dateUtils } from '../../utils/dateUtils.js';
import { showToast } from '../../utils/helpers.js';

export class BudgetDetails {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this.monthlyData = null;
        this.initialize();
    }

    async initialize() {
        await this.loadMonthlyBreakdown();
        this.render();
        this.setupEventListeners();
    }

    async loadMonthlyBreakdown() {
        try {
            this.monthlyData = await budgetService.getMonthlyBreakdown(
                this.currentYear,
                this.currentMonth
            );
        } catch (error) {
            showToast('Error loading monthly breakdown', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <span class="card-title">Budget Details</span>
                    <div class="row">
                        <div class="input-field col s6 m3">
                            <select id="month-selector">
                                ${this.renderMonthOptions()}
                            </select>
                            <label>Month</label>
                        </div>
                        <div class="input-field col s6 m3">
                            <select id="year-selector">
                                ${this.renderYearOptions()}
                            </select>
                            <label>Year</label>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col s12">
                            <ul class="collapsible">
                                <li>
                                    <div class="collapsible-header">
                                        <i class="material-icons">attach_money</i>
                                        Revenue Breakdown
                                        <span class="badge">${formatCurrency(this.monthlyData.totalRevenue)}</span>
                                    </div>
                                    <div class="collapsible-body">
                                        ${this.renderRevenueBreakdown()}
                                    </div>
                                </li>
                                <li>
                                    <div class="collapsible-header">
                                        <i class="material-icons">money_off</i>
                                        Expense Breakdown
                                        <span class="badge">${formatCurrency(this.monthlyData.totalExpenses)}</span>
                                    </div>
                                    <div class="collapsible-body">
                                        ${this.renderExpenseBreakdown()}
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize Materialize components
        M.FormSelect.init(this.container.querySelectorAll('select'));
        M.Collapsible.init(this.container.querySelectorAll('.collapsible'));
    }

    renderMonthOptions() {
        const months = dateUtils.getMonthNames();
        return months.map((month, index) => `
            <option value="${index + 1}" ${index + 1 === this.currentMonth ? 'selected' : ''}>
                ${month}
            </option>
        `).join('');
    }

    renderYearOptions() {
        const startYear = 2020; // Adjust as needed
        const years = [];
        for (let year = startYear; year <= this.currentYear; year++) {
            years.push(year);
        }
        return years.map(year => `
            <option value="${year}" ${year === this.currentYear ? 'selected' : ''}>
                ${year}
            </option>
        `).join('');
    }

    renderRevenueBreakdown() {
        return `
            <table class="striped">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>% of Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.monthlyData.revenueBreakdown.map(item => `
                        <tr>
                            <td>${item.category}</td>
                            <td>${formatCurrency(item.amount)}</td>
                            <td>${(item.percentage * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderExpenseBreakdown() {
        return `
            <table class="striped">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>% of Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.monthlyData.expenseBreakdown.map(item => `
                        <tr>
                            <td>${item.category}</td>
                            <td>${formatCurrency(item.amount)}</td>
                            <td>${(item.percentage * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    setupEventListeners() {
        const monthSelector = this.container.querySelector('#month-selector');
        const yearSelector = this.container.querySelector('#year-selector');

        if (monthSelector && yearSelector) {
            monthSelector.addEventListener('change', async (e) => {
                this.currentMonth = parseInt(e.target.value);
                await this.loadMonthlyBreakdown();
                this.render();
            });

            yearSelector.addEventListener('change', async (e) => {
                this.currentYear = parseInt(e.target.value);
                await this.loadMonthlyBreakdown();
                this.render();
            });
        }
    }
}
