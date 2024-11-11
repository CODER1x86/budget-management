import { analyticsService } from '../../services/analytics/analytics.service.js';
import { dateUtils } from '../../utils/dateUtils.js';
import { showToast } from '../../utils/helpers.js';

export class ReportGenerator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
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
                    <span class="card-title">Generate Reports</span>
                    <form id="report-form">
                        <div class="row">
                            <div class="input-field col s12 m6">
                                <select id="report-type" required>
                                    <option value="" disabled selected>Choose report type</option>
                                    <option value="revenue">Revenue Report</option>
                                    <option value="expense">Expense Report</option>
                                    <option value="inventory">Inventory Report</option>
                                    <option value="profit-loss">Profit & Loss Statement</option>
                                    <option value="custom">Custom Report</option>
                                </select>
                                <label>Report Type</label>
                            </div>
                            <div class="input-field col s12 m6">
                                <select id="report-format" required>
                                    <option value="pdf" selected>PDF</option>
                                    <option value="excel">Excel</option>
                                    <option value="csv">CSV</option>
                                </select>
                                <label>Format</label>
                            </div>
                        </div>
                        <div class="row">
                            <div class="input-field col s12 m6">
                                <input type="text" id="start-date" class="datepicker" required>
                                <label for="start-date">Start Date</label>
                            </div>
                            <div class="input-field col s12 m6">
                                <input type="text" id="end-date" class="datepicker" required>
                                <label for="end-date">End Date</label>
                            </div>
                        </div>
                        <div id="custom-options" style="display: none;">
                            <div class="row">
                                <div class="col s12">
                                    <h6>Select Metrics</h6>
                                    <p>
                                        <label>
                                            <input type="checkbox" class="filled-in" name="metrics" value="revenue">
                                            <span>Revenue</span>
                                        </label>
                                    </p>
                                    <p>
                                        <label>
                                            <input type="checkbox" class="filled-in" name="metrics" value="expenses">
                                            <span>Expenses</span>
                                        </label>
                                    </p>
                                    <p>
                                        <label>
                                            <input type="checkbox" class="filled-in" name="metrics" value="profit">
                                            <span>Profit</span>
                                        </label>
                                    </p>
                                    <p>
                                        <label>
                                            <input type="checkbox" class="filled-in" name="metrics" value="inventory">
                                            <span>Inventory</span>
                                        </label>
                                    </p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="input-field col s12">
                                    <select multiple id="categories">
                                        <option value="all">All Categories</option>
                                        <option value="category1">Category 1</option>
                                        <option value="category2">Category 2</option>
                                    </select>
                                    <label>Categories</label>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col s12">
                                <button class="btn waves-effect waves-light" type="submit">
                                    Generate Report
                                    <i class="material-icons right">send</i>
                                </button>
                            </div>
                        </div>
                    </form>
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
        const form = this.container.querySelector('#report-form');
        const reportType = this.container.querySelector('#report-type');
        const customOptions = this.container.querySelector('#custom-options');

        if (reportType) {
            reportType.addEventListener('change', (e) => {
                customOptions.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.generateReport();
            });
        }
    }

    async generateReport() {
        try {
            const formData = this.getFormData();
            const response = await analyticsService.generateReport(
                formData.reportType,
                {
                    format: formData.format,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    metrics: formData.metrics,
                    categories: formData.categories
                }
            );

            if (response.url) {
                window.open(response.url, '_blank');
            }
            
            showToast('Report generated successfully', 'success');
        } catch (error) {
            showToast('Error generating report', 'error');
        }
    }

    getFormData() {
        return {
            reportType: this.container.querySelector('#report-type').value,
            format: this.container.querySelector('#report-format').value,
            startDate: this.container.querySelector('#start-date').value,
            endDate: this.container.querySelector('#end-date').value,
            metrics: Array.from(this.container.querySelectorAll('input[name="metrics"]:checked'))
                .map(cb => cb.value),
            categories: Array.from(this.container.querySelector('#categories').selectedOptions)
                .map(option => option.value)
        };
    }
}
