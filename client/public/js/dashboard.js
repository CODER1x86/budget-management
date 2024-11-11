document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Load dashboard data
        const dashboardData = await apiRequest('/dashboard/summary');
        
        // Update summary cards
        updateSummaryCards(dashboardData);
        
        // Initialize charts
        initializeCharts(dashboardData);
        
        // Load recent transactions
        loadRecentTransactions();
        
        // Setup refresh interval
        setInterval(refreshDashboardData, 300000); // Refresh every 5 minutes
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
}

function updateSummaryCards(data) {
    document.getElementById('total-revenue').textContent = formatCurrency(data.totalRevenue);
    document.getElementById('total-expenses').textContent = formatCurrency(data.totalExpenses);
    document.getElementById('net-income').textContent = formatCurrency(data.netIncome);
    document.getElementById('pending-payments').textContent = data.pendingPayments;
}

function initializeCharts(data) {
    // Revenue vs Expenses Chart
    const revenueExpensesCtx = document.getElementById('revenue-expenses-chart').getContext('2d');
    new Chart(revenueExpensesCtx, {
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

async function loadRecentTransactions() {
    try {
        const transactions = await apiRequest('/transactions/recent');
        const transactionsList = document.getElementById('recent-transactions');
        
        transactionsList.innerHTML = transactions.map(transaction => `
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
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

async function refreshDashboardData() {
    try {
        const dashboardData = await apiRequest('/dashboard/summary');
        updateSummaryCards(dashboardData);
    } catch (error) {
        console.error('Error refreshing dashboard data:', error);
    }
}
