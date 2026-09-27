/**
 * Kudla Kitchen - Admin Coupon Management Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-coupons-container')) {
        AdminCoupons.init();
    }
});

const AdminCoupons = {
    state: {
        coupons: [],
        filteredCoupons: [],
        searchQuery: ''
    },

    async init() {
        this.bindEvents();
        await this.loadCoupons();
    },

    bindEvents() {
        const searchInput = document.getElementById('coupon-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        const addBtn = document.getElementById('add-coupon-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        const refreshBtn = document.getElementById('refresh-coupons-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing coupons...', 'info');
                this.loadCoupons();
            });
        }
    },

    async loadCoupons() {
        const tableBody = document.getElementById('coupons-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔄</div>
                    <div style="color: var(--text-muted); font-weight: 600;">Loading coupons database...</div>
                </td>
            </tr>
        `;

        const res = await AdminAPI.getCoupons();
        if (!res.success || !Array.isArray(res.data)) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                        <div style="font-weight: 700; color: var(--text-primary); margin-top: 0.5rem;">Failed to load coupons</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">${AdminApp.escapeHtml(res.message || 'Check connection.')}</div>
                        <button onclick="AdminCoupons.loadCoupons()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                    </td>
                </tr>
            `;
            return;
        }

        this.state.coupons = res.data;
        this.applyFilters();
    },

    applyFilters() {
        const { coupons, searchQuery } = this.state;
        let filtered = coupons.filter(c => {
            const code = (c.code || '').toLowerCase();
            return !searchQuery || code.includes(searchQuery);
        });

        this.state.filteredCoupons = filtered;
        this.renderCouponsTable(filtered);
    },

    renderCouponsTable(items) {
        const tableBody = document.getElementById('coupons-table-body');
        if (!tableBody) return;

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎟️</div>
                        <div style="font-weight: 700; color: var(--text-primary);">No Coupons Found</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">No promotional coupons match your search.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = items.map(c => {
            const isPercent = c.discount_type === 'percentage';
            const valDisplay = isPercent ? `${parseFloat(c.discount_amount)}% OFF` : `₹${parseFloat(c.discount_amount).toFixed(2)} OFF`;
            const status = c.status || 'active';
            const badgeClass = status === 'active' ? 'status-delivered' : 'status-cancelled';

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <span style="font-size: 1.2rem;">🎟️</span>
                            <strong style="font-family: monospace; font-size: 1.1rem; color: var(--accent-primary); letter-spacing: 1px;">
                                ${AdminApp.escapeHtml(c.code)}
                            </strong>
                        </div>
                    </td>
                    <td><strong>${valDisplay}</strong></td>
                    <td>₹${parseFloat(c.min_order_amount || 0).toFixed(2)}</td>
                    <td>${c.max_discount ? `₹${parseFloat(c.max_discount).toFixed(2)}` : 'N/A'}</td>
                    <td><span style="font-size: 0.82rem; color: var(--text-secondary);">${c.start_date} to ${c.expiry_date}</span></td>
                    <td>${c.used_count || 0} / ${c.usage_limit || '∞'}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <span class="order-badge ${badgeClass}">${AdminApp.escapeHtml(status.toUpperCase())}</span>
                            <button onclick="AdminCoupons.confirmDeleteCoupon(${c.id}, '${AdminApp.escapeHtml(c.code)}')" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #dc2626;">
                                🗑️ Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    },

    openAddModal() {
        this.renderCouponModal('Create Promotional Coupon');
    },

    renderCouponModal(title) {
        let modal = document.getElementById('coupon-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'coupon-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        const todayStr = new Date().toISOString().split('T')[0];

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <div class="modal-header">
                    <h3 style="font-size: 1.15rem; font-weight: 800;">${AdminApp.escapeHtml(title)}</h3>
                    <button onclick="AdminCoupons.closeModal()" class="btn-close">✕</button>
                </div>

                <div class="modal-body">
                    <form id="coupon-form" onsubmit="AdminCoupons.handleFormSubmit(event)">
                        <div class="form-group">
                            <label class="detail-label">Coupon Code (Uppercase) *</label>
                            <input type="text" id="coupon-code" class="form-input" required placeholder="e.g. WELCOME20" style="text-transform: uppercase; font-family: monospace; font-weight: 700;" />
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="detail-label">Discount Type *</label>
                                <select id="coupon-type" class="select-input" style="width: 100%; border-radius: var(--radius-sm);" required>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="detail-label">Discount Amount *</label>
                                <input type="number" step="0.01" id="coupon-amount" class="form-input" required placeholder="10.00" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="detail-label">Min Order Threshold (₹)</label>
                                <input type="number" step="0.01" id="coupon-min-order" class="form-input" placeholder="20.00" value="0.00" />
                            </div>

                            <div class="form-group">
                                <label class="detail-label">Max Discount Cap (₹)</label>
                                <input type="number" step="0.01" id="coupon-max-disc" class="form-input" placeholder="15.00" />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="detail-label">Start Date *</label>
                                <input type="date" id="coupon-start" class="form-input" required value="${todayStr}" />
                            </div>

                            <div class="form-group">
                                <label class="detail-label">Expiry Date *</label>
                                <input type="date" id="coupon-expiry" class="form-input" required value="2026-12-31" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="detail-label">Usage Limit</label>
                            <input type="number" id="coupon-limit" class="form-input" value="100" placeholder="100" />
                        </div>

                        <div class="modal-footer" style="padding-right: 0; padding-left: 0; background: transparent;">
                            <button type="button" onclick="AdminCoupons.closeModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Coupon</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    async handleFormSubmit(e) {
        e.preventDefault();

        const code = document.getElementById('coupon-code').value.trim().toUpperCase();
        const discount_type = document.getElementById('coupon-type').value;
        const discount_amount = parseFloat(document.getElementById('coupon-amount').value);
        const min_order_amount = parseFloat(document.getElementById('coupon-min-order').value) || 0.00;
        const max_discount = parseFloat(document.getElementById('coupon-max-disc').value) || null;
        const start_date = document.getElementById('coupon-start').value;
        const expiry_date = document.getElementById('coupon-expiry').value;
        const usage_limit = parseInt(document.getElementById('coupon-limit').value, 10) || 100;

        if (!code || isNaN(discount_amount) || !start_date || !expiry_date) {
            AdminApp.showToast('Please complete required fields.', 'error');
            return;
        }

        const data = {
            code,
            discount_type,
            discount_amount,
            min_order_amount,
            max_discount,
            start_date,
            expiry_date,
            usage_limit
        };

        const res = await AdminAPI.addCoupon(data);
        if (res.success) {
            AdminApp.showToast('Coupon created successfully!', 'success');
            this.closeModal();
            await this.loadCoupons();
        } else {
            AdminApp.showToast(res.message || 'Failed to create coupon', 'error');
        }
    },

    confirmDeleteCoupon(id, code) {
        if (confirm(`Are you sure you want to delete coupon '${code}' (ID #${id})?`)) {
            this.handleDeleteCoupon(id);
        }
    },

    async handleDeleteCoupon(id) {
        const res = await AdminAPI.deleteCoupon(id);
        if (res.success) {
            AdminApp.showToast('Coupon deleted successfully!', 'success');
            await this.loadCoupons();
        } else {
            AdminApp.showToast(res.message || 'Could not delete coupon', 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('coupon-modal');
        if (modal) modal.classList.remove('active');
    }
};
