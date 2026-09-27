/**
 * Kudla Kitchen - Admin Portal Application Script
 * Manages Admin Auth Guard, Dashboard Metrics, Theme switcher, Toast alerts & UI state.
 */

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});

const AdminApp = {
    state: {
        dashboardStats: null,
        reportsData: null,
        recentOrders: []
    },

    async init() {
        this.initTheme();
        
        const isLoginPage = window.location.pathname.includes('login.html');

        // Verify Admin Auth Guard
        if (!isLoginPage) {
            if (!AdminAPI.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            // Double-check profile with backend
            const profileRes = await AdminAPI.getProfile();
            if (!profileRes.success || !profileRes.data || profileRes.data.role !== 'admin') {
                AdminAPI.removeToken();
                window.location.href = 'login.html';
                return;
            }
        } else {
            if (AdminAPI.isLoggedIn()) {
                window.location.href = 'index.html';
                return;
            }
        }

        this.initProfileNav();
        this.initEventListeners();

        if (document.getElementById('admin-dashboard-container')) {
            this.loadDashboard();
        }
    },

    /* --- Theme Manager --- */
    initTheme() {
        const savedTheme = localStorage.getItem('kk_admin_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kk_admin_theme', newTheme);
        this.updateThemeToggleIcon(newTheme);
    },

    updateThemeToggleIcon(theme) {
        const btn = document.getElementById('admin-theme-btn');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        }
    },

    /* --- Admin Profile Nav --- */
    initProfileNav() {
        const user = AdminAPI.getUser();
        const profileBox = document.getElementById('admin-profile-display');
        if (profileBox && user) {
            profileBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                        ${this.escapeHtml(user.name.charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.9rem;">${this.escapeHtml(user.name)}</strong>
                        <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">${this.escapeHtml(user.role)}</span>
                    </div>
                </div>
            `;
        }
    },

    async logout() {
        this.showToast('Logging out from Admin Portal...', 'info');
        await AdminAPI.logout();
        window.location.href = 'login.html';
    },

    /* --- Event Listeners --- */
    initEventListeners() {
        const themeBtn = document.getElementById('admin-theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        const sidebarToggle = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('admin-sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    },

    /* --- Toast Notifications --- */
    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `
            <span>${icon}</span>
            <span>${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    /* --- Load Admin Dashboard --- */
    async loadDashboard() {
        const container = document.getElementById('admin-dashboard-container');
        if (!container) return;

        container.innerHTML = `
            <div class="state-box" style="margin: 2rem 0;">
                <div class="skeleton" style="height: 180px; width: 100%;"></div>
            </div>
        `;

        const [dashRes, repRes, ordRes] = await Promise.all([
            AdminAPI.getDashboard(),
            AdminAPI.getReports(),
            AdminAPI.getRecentOrders()
        ]);

        if (!dashRes.success || !dashRes.data) {
            container.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">⚠️</div>
                    <div class="state-title">Failed to load Admin Dashboard statistics</div>
                    <div class="state-desc">${this.escapeHtml(dashRes.message || 'Check database connection and admin permissions.')}</div>
                    <button onclick="AdminApp.loadDashboard()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
            return;
        }

        const stats = dashRes.data;
        const reports = repRes.success && repRes.data ? repRes.data : {};
        const orders = ordRes.success && Array.isArray(ordRes.data) ? ordRes.data : [];

        this.state.dashboardStats = stats;
        this.state.reportsData = reports;
        this.state.recentOrders = orders;

        this.renderDashboardUI(stats, reports, orders, container);
    },

    renderDashboardUI(stats, reports, orders, container) {
        const totalUsers = stats.total_users || 0;
        const totalFood = stats.total_food_items || 0;
        const totalOrders = stats.total_orders || 0;
        const totalRevenue = parseFloat(stats.total_revenue || 0).toFixed(2);
        const topCategory = reports.top_category || 'Gourmet Pizzas';

        // Render Recent Orders Table rows
        const recentOrdersRows = orders.slice(0, 5).map(o => {
            const statusBadge = this.getOrderStatusBadge(o.order_status);
            const dateStr = new Date(o.created_at).toLocaleDateString();
            return `
                <tr>
                    <td><strong>${this.escapeHtml(o.order_number)}</strong></td>
                    <td>${this.escapeHtml(o.customer_name || 'Customer')}</td>
                    <td>${this.escapeHtml(o.city || 'N/A')}</td>
                    <td><span class="order-badge ${statusBadge.class}">${statusBadge.icon} ${statusBadge.label}</span></td>
                    <td><strong>₹${parseFloat(o.final_amount).toFixed(2)}</strong></td>
                    <td>${dateStr}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <!-- Stat Cards Grid -->
            <div class="admin-stats-grid">
                <div class="admin-stat-card">
                    <div class="admin-stat-icon" style="background: rgba(230, 81, 0, 0.12); color: var(--accent-primary);">👥</div>
                    <div>
                        <span class="admin-stat-label">Total Customers</span>
                        <h3 class="admin-stat-val">${totalUsers}</h3>
                    </div>
                </div>

                <div class="admin-stat-card">
                    <div class="admin-stat-icon" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6;">🍕</div>
                    <div>
                        <span class="admin-stat-label">Total Food Items</span>
                        <h3 class="admin-stat-val">${totalFood}</h3>
                    </div>
                </div>

                <div class="admin-stat-card">
                    <div class="admin-stat-icon" style="background: rgba(168, 85, 247, 0.12); color: #a855f7;">📦</div>
                    <div>
                        <span class="admin-stat-label">Total Orders</span>
                        <h3 class="admin-stat-val">${totalOrders}</h3>
                    </div>
                </div>

                <div class="admin-stat-card">
                    <div class="admin-stat-icon" style="background: rgba(34, 197, 94, 0.12); color: var(--accent-secondary);">💰</div>
                    <div>
                        <span class="admin-stat-label">Total Revenue</span>
                        <h3 class="admin-stat-val">₹${totalRevenue}</h3>
                    </div>
                </div>
            </div>

            <!-- Analytical KPI Strip -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem;">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3>📦 Recent Customer Orders</h3>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Real-time Database Overview</span>
                    </div>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>City</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.length > 0 ? recentOrdersRows : `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No orders placed yet.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3>📊 Insights & Reports</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                        <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: var(--radius-md);">
                            <span style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Top Performing Category</span>
                            <h4 style="font-size: 1.3rem; font-weight: 800; color: var(--accent-primary); margin-top: 0.3rem;">🏆 ${this.escapeHtml(topCategory)}</h4>
                        </div>
                        <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: var(--radius-md);">
                            <span style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Paid Revenue Settled</span>
                            <h4 style="font-size: 1.3rem; font-weight: 800; color: var(--accent-secondary); margin-top: 0.3rem;">₹${totalRevenue}</h4>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getOrderStatusBadge(status) {
        const configs = {
            'pending': { label: 'Pending', icon: '⏳', class: 'status-pending' },
            'confirmed': { label: 'Confirmed', icon: '👍', class: 'status-confirmed' },
            'preparing': { label: 'Preparing', icon: '👨‍🍳', class: 'status-preparing' },
            'ready': { label: 'Ready', icon: '🛍️', class: 'status-ready' },
            'out_for_delivery': { label: 'Out for Delivery', icon: '🚴', class: 'status-delivery' },
            'delivered': { label: 'Delivered', icon: '✅', class: 'status-delivered' },
            'cancelled': { label: 'Cancelled', icon: '❌', class: 'status-cancelled' }
        };
        return configs[status] || { label: status, icon: '📦', class: 'status-pending' };
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};
