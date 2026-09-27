/**
 * Kudla Kitchen - Admin Reports & Analytics Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-reports-container')) {
        AdminReports.init();
    }
});

const AdminReports = {
    state: {
        dashboard: null,
        popularFood: [],
        sales: null,
        orderStats: null
    },

    async init() {
        this.bindEvents();
        await this.loadAllAnalytics();
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-reports-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing real-time analytics...', 'info');
                this.loadAllAnalytics();
            });
        }
    },

    async loadAllAnalytics() {
        const [dashRes, popularRes, salesRes, orderStatsRes] = await Promise.all([
            AdminAPI.getAnalyticsDashboard(),
            AdminAPI.getAnalyticsPopularFood(),
            AdminAPI.getAnalyticsSales(),
            AdminAPI.getAnalyticsOrders()
        ]);

        if (dashRes.success && dashRes.data) {
            this.state.dashboard = dashRes.data;
            this.renderDashboardKpis(dashRes.data);
        }

        if (popularRes.success && Array.isArray(popularRes.data)) {
            this.state.popularFood = popularRes.data;
            this.renderPopularFood(popularRes.data);
        }

        if (salesRes.success && salesRes.data) {
            this.state.sales = salesRes.data;
            this.renderSalesAnalytics(salesRes.data);
        }

        if (orderStatsRes.success && orderStatsRes.data) {
            this.state.orderStats = orderStatsRes.data;
            this.renderOrderBreakdown(orderStatsRes.data);
        }
    },

    renderDashboardKpis(data) {
        const totalRev = parseFloat(data.total_revenue || 0).toFixed(2);
        const todayRev = parseFloat(data.today_revenue || 0).toFixed(2);
        const totalOrd = data.total_orders || 0;
        const todayOrd = data.today_orders || 0;
        const compOrd = data.completed_orders || 0;
        const cancOrd = data.cancelled_orders || 0;

        const container = document.getElementById('kpi-summary-strip');
        if (!container) return;

        container.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-icon" style="background: rgba(34,197,94,0.12); color: var(--accent-secondary);">💰</div>
                <div>
                    <span class="admin-stat-label">Total Paid Revenue</span>
                    <h3 class="admin-stat-val">₹${totalRev}</h3>
                </div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-icon" style="background: rgba(59,130,246,0.12); color: #1d4ed8;">📈</div>
                <div>
                    <span class="admin-stat-label">Today's Revenue</span>
                    <h3 class="admin-stat-val">₹${todayRev}</h3>
                </div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-icon" style="background: rgba(168,85,247,0.12); color: #a855f7;">📦</div>
                <div>
                    <span class="admin-stat-label">Total Lifetime Orders</span>
                    <h3 class="admin-stat-val">${totalOrd}</h3>
                </div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-icon" style="background: rgba(230,81,0,0.12); color: var(--accent-primary);">🛍️</div>
                <div>
                    <span class="admin-stat-label">Today's Orders</span>
                    <h3 class="admin-stat-val">${todayOrd}</h3>
                </div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-icon" style="background: rgba(20,184,166,0.12); color: #0f766e;">✅</div>
                <div>
                    <span class="admin-stat-label">Completed Deliveries</span>
                    <h3 class="admin-stat-val">${compOrd}</h3>
                </div>
            </div>

            <div class="admin-stat-card">
                <div class="admin-stat-icon" style="background: rgba(239,68,68,0.12); color: #dc2626;">❌</div>
                <div>
                    <span class="admin-stat-label">Cancelled Orders</span>
                    <h3 class="admin-stat-val">${cancOrd}</h3>
                </div>
            </div>
        `;
    },

    renderPopularFood(items) {
        const body = document.getElementById('popular-food-table-body');
        if (!body) return;

        if (items.length === 0) {
            body.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No sales data available yet.</td></tr>`;
            return;
        }

        const maxSold = Math.max(...items.map(i => parseInt(i.total_units_sold || 0, 10)), 1);

        const rows = items.map((item, idx) => {
            const units = parseInt(item.total_units_sold || 0, 10);
            const rev = parseFloat(item.total_revenue || 0).toFixed(2);
            const percent = Math.min(100, Math.round((units / maxSold) * 100));

            return `
                <tr>
                    <td><strong>#${idx + 1}</strong></td>
                    <td>
                        <strong style="display: block;">${AdminApp.escapeHtml(item.name)}</strong>
                        <span style="font-size: 0.78rem; color: var(--text-muted);">${AdminApp.escapeHtml(item.category_name || 'Menu')}</span>
                    </td>
                    <td><strong>${units} units</strong></td>
                    <td><strong style="color: var(--accent-primary);">₹${rev}</strong></td>
                    <td style="width: 30%;">
                        <div style="background: var(--bg-surface); height: 12px; border-radius: 6px; overflow: hidden; position: relative;">
                            <div style="width: ${percent}%; height: 100%; background: var(--accent-primary); border-radius: 6px; transition: width 0.5s ease;"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        body.innerHTML = rows;
    },

    renderSalesAnalytics(sales) {
        const dailyBody = document.getElementById('daily-sales-table-body');
        if (!dailyBody) return;

        const daily = sales.daily_sales || [];
        if (daily.length === 0) {
            dailyBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">No daily sales records.</td></tr>`;
            return;
        }

        const rows = daily.map(d => {
            const rev = parseFloat(d.total_revenue || 0).toFixed(2);
            const ords = parseInt(d.total_orders || 0, 10);
            const aov = ords > 0 ? (parseFloat(d.total_revenue) / ords).toFixed(2) : '0.00';

            return `
                <tr>
                    <td><strong>${d.date}</strong></td>
                    <td>${ords} orders</td>
                    <td><strong style="color: var(--accent-secondary);">₹${rev}</strong></td>
                    <td>₹${aov}</td>
                </tr>
            `;
        }).join('');

        dailyBody.innerHTML = rows;
    },

    renderOrderBreakdown(stats) {
        const body = document.getElementById('order-status-breakdown-body');
        if (!body) return;

        const breakdown = stats.by_status || [];
        if (breakdown.length === 0) {
            body.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 2rem;">No status data available.</td></tr>`;
            return;
        }

        const total = breakdown.reduce((sum, b) => sum + parseInt(b.count, 10), 0) || 1;

        const rows = breakdown.map(b => {
            const badge = AdminApp.getOrderStatusBadge(b.order_status);
            const count = parseInt(b.count, 10);
            const pct = ((count / total) * 100).toFixed(1);

            return `
                <tr>
                    <td><span class="order-badge ${badge.class}">${badge.icon} ${badge.label}</span></td>
                    <td><strong>${count} orders</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <div style="flex-grow: 1; background: var(--bg-surface); height: 10px; border-radius: 5px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: var(--accent-primary);"></div>
                            </div>
                            <span style="font-size: 0.82rem; font-weight: 700; min-width: 45px;">${pct}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        body.innerHTML = rows;
    }
};
