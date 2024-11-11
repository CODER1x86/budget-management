import { formatCurrency } from '../../utils/helpers.js';

export class RevenueChart {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = null;
    }

    initialize(data) {
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: data.months,
                datasets: [
                    {
                        label: 'Revenue',
                        data: data.revenueData,
                        backgroundColor: 'rgba(76, 175, 80, 0.5)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: data.expenseData,
                        backgroundColor: 'rgba(244, 67, 54, 0.5)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 1
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
        });
    }

    update(data) {
        if (this.chart) {
            this.chart.data.labels = data.months;
            this.chart.data.datasets[0].data = data.revenueData;
            this.chart.data.datasets[1].data = data.expenseData;
            this.chart.update();
        }
    }
}
