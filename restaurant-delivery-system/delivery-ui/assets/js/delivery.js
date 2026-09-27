/**
 * Kudla Kitchen - Delivery Partner Core Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    DeliveryApp.init();
});

const DeliveryApp = {
    async init() {
        this.initTheme();
        const isLoginPage = window.location.pathname.includes('login.html');

        if (!isLoginPage) {
            if (!DeliveryAPI.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            const profileRes = await DeliveryAPI.getProfile();
            if (!profileRes.success || !profileRes.data || !['delivery_partner', 'admin'].includes(profileRes.data.role)) {
                DeliveryAPI.removeToken();
                window.location.href = 'login.html';
                return;
            }
        } else {
            if (DeliveryAPI.isLoggedIn()) {
                window.location.href = 'index.html';
                return;
            }
        }

        this.initProfileNav();
        this.bindEvents();

        if (document.getElementById('delivery-dashboard-container')) {
            this.loadDashboard();
        }
    },

    initTheme() {
        const savedTheme = localStorage.getItem('kk_delivery_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kk_delivery_theme', newTheme);
        this.updateThemeToggleIcon(newTheme);
    },

    updateThemeToggleIcon(theme) {
        const btn = document.getElementById('delivery-theme-btn');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    initProfileNav() {
        const user = DeliveryAPI.getUser();
        const profileBox = document.getElementById('delivery-profile-display');
        if (profileBox && user) {
            profileBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                        🚴
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.88rem;">${this.escapeHtml(user.name)}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Rider Partner</span>
                    </div>
                </div>
            `;
        }
    },

    bindEvents() {
        const themeBtn = document.getElementById('delivery-theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
    },

    async logout() {
        this.showToast('Logging out Rider Panel...', 'info');
        await DeliveryAPI.logout();
        window.location.href = 'login.html';
    },

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
        toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span><span>${this.escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    async loadDashboard() {
        const container = document.getElementById('delivery-dashboard-container');
        if (!container) return;

        const res = await DeliveryAPI.getDashboard();
        if (!res.success || !res.data) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                    <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                    <h3>Failed to load Rider Dashboard</h3>
                    <p style="color: var(--text-muted);">${this.escapeHtml(res.message || '')}</p>
                </div>
            `;
            return;
        }

        const stats = res.data;
        const isAvail = stats.is_available;

        container.innerHTML = `
            <!-- Availability Strip -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Rider Duty Status</span>
                    <span class="order-badge ${isAvail ? 'status-delivered' : 'status-assigned'}" style="font-size: 0.9rem; margin-top: 0.3rem;">
                        ${isAvail ? '🟢 On Duty / Available' : '🟡 Active Delivery'}
                    </span>
                </div>
                <a href="orders.html" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                    My Orders ➔
                </a>
            </div>

            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="delivery-card" style="margin-bottom: 0;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Active Deliveries</span>
                    <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--accent-primary); margin-top: 0.3rem;">${stats.active_deliveries}</h2>
                </div>

                <div class="delivery-card" style="margin-bottom: 0;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Completed Today</span>
                    <h2 style="font-size: 2.2rem; font-weight: 800; color: #22c55e; margin-top: 0.3rem;">${stats.completed_deliveries}</h2>
                </div>
            </div>

            <div class="delivery-card" style="text-align: center; padding: 2rem;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛵</div>
                <h3 style="font-size: 1.2rem; font-weight: 800;">Ready for Pickups?</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.3rem; margin-bottom: 1.2rem;">
                    Check your assigned orders list to view customer addresses and update order delivery statuses.
                </p>
                <a href="orders.html" class="btn btn-primary btn-block">View Assigned Deliveries</a>
            </div>
        `;
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
