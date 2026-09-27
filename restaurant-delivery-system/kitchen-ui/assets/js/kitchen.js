/**
 * Kudla Kitchen - Kitchen Application Core Script
 */

document.addEventListener('DOMContentLoaded', () => {
    KitchenApp.init();
});

const KitchenApp = {
    async init() {
        this.initTheme();
        const isLoginPage = window.location.pathname.includes('login.html');

        if (!isLoginPage) {
            if (!KitchenAPI.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            const profileRes = await KitchenAPI.getProfile();
            if (!profileRes.success || !profileRes.data || !['kitchen', 'admin'].includes(profileRes.data.role)) {
                KitchenAPI.removeToken();
                window.location.href = 'login.html';
                return;
            }
        } else {
            if (KitchenAPI.isLoggedIn()) {
                window.location.href = 'index.html';
                return;
            }
        }

        this.initProfileNav();
        this.bindEvents();

        if (document.getElementById('kitchen-dashboard-container')) {
            this.loadDashboard();
        }
    },

    initTheme() {
        const savedTheme = localStorage.getItem('kk_kitchen_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kk_kitchen_theme', newTheme);
        this.updateThemeToggleIcon(newTheme);
    },

    updateThemeToggleIcon(theme) {
        const btn = document.getElementById('kitchen-theme-btn');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    initProfileNav() {
        const user = KitchenAPI.getUser();
        const profileBox = document.getElementById('kitchen-profile-display');
        if (profileBox && user) {
            profileBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center;">
                        👨‍🍳
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.9rem;">${this.escapeHtml(user.name)}</strong>
                        <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">${this.escapeHtml(user.role)}</span>
                    </div>
                </div>
            `;
        }
    },

    bindEvents() {
        const themeBtn = document.getElementById('kitchen-theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        const sidebarToggle = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('kitchen-sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    },

    async logout() {
        this.showToast('Logging out...', 'info');
        await KitchenAPI.logout();
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
        const container = document.getElementById('kitchen-dashboard-container');
        if (!container) return;

        const res = await KitchenAPI.getDashboard();
        if (!res.success || !Array.isArray(res.data)) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                    <h3>Failed to load Kitchen Dashboard</h3>
                    <p style="color: var(--text-muted);">${this.escapeHtml(res.message || '')}</p>
                </div>
            `;
            return;
        }

        const tickets = res.data;
        const confirmedCount = tickets.filter(t => t.order_status === 'confirmed').length;
        const preparingCount = tickets.filter(t => t.order_status === 'preparing').length;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Active Tickets</span>
                    <h2 style="font-size: 2rem; font-weight: 800; color: var(--accent-primary); margin-top: 0.3rem;">${tickets.length}</h2>
                </div>
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Confirmed Tickets</span>
                    <h2 style="font-size: 2rem; font-weight: 800; color: #3b82f6; margin-top: 0.3rem;">${confirmedCount}</h2>
                </div>
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Preparing Tickets</span>
                    <h2 style="font-size: 2rem; font-weight: 800; color: #a855f7; margin-top: 0.3rem;">${preparingCount}</h2>
                </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.8rem;">
                <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem;">
                    <span>👨‍🍳 Active Kitchen Tickets</span>
                    <a href="orders.html" class="btn btn-primary" style="margin-left: auto; font-size: 0.85rem;">Open KDS Queue ➔</a>
                </h3>
                <div class="ticket-grid">
                    ${tickets.map(t => `
                        <div class="ticket-card status-${t.order_status}">
                            <div class="ticket-header">
                                <span class="ticket-number">${this.escapeHtml(t.order_number)}</span>
                                <span class="order-badge status-${t.order_status}">${t.order_status.toUpperCase()}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                                Items: <strong>${t.item_count} items</strong> | Placed: ${new Date(t.created_at).toLocaleTimeString()}
                            </div>
                            <a href="orders.html" class="btn btn-secondary btn-lg">View Ticket Details</a>
                        </div>
                    `).join('')}
                </div>
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
