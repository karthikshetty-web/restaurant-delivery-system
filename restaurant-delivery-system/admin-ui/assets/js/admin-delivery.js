/**
 * Kudla Kitchen - Admin Delivery Logistics Management Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-delivery-container')) {
        AdminDelivery.init();
    }
});

const AdminDelivery = {
    state: {
        partners: [],
        zones: []
    },

    async init() {
        this.bindEvents();
        await this.loadDeliveryData();
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-delivery-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing delivery logistics data...', 'info');
                this.loadDeliveryData();
            });
        }
    },

    async loadDeliveryData() {
        const partnersBody = document.getElementById('partners-table-body');
        const zonesBody = document.getElementById('zones-table-body');

        if (partnersBody) {
            partnersBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">Loading delivery riders...</td>
                </tr>
            `;
        }

        const res = await AdminAPI.getDeliveryLogistics();
        if (!res.success || !res.data) {
            if (partnersBody) {
                partnersBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">Failed to load delivery data.</td>
                    </tr>
                `;
            }
            return;
        }

        this.state.partners = res.data.partners || [];
        this.state.zones = res.data.zones || [];

        this.renderPartnersTable(this.state.partners);
        this.renderZonesTable(this.state.zones);
    },

    renderPartnersTable(partners) {
        const tableBody = document.getElementById('partners-table-body');
        if (!tableBody) return;

        if (partners.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">No delivery partners registered in system.</td>
                </tr>
            `;
            return;
        }

        const rows = partners.map(p => {
            const isAvail = p.is_available == 1;
            const availBadge = isAvail ? 
                `<span class="order-badge status-delivered">Available 🟢</span>` : 
                `<span class="order-badge status-cancelled">On Delivery / Busy 🔴</span>`;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(99,102,241,0.15); color: #4338ca; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">
                                🚴
                            </div>
                            <div>
                                <strong style="display: block;">${AdminApp.escapeHtml(p.name)}</strong>
                                <span style="font-size: 0.78rem; color: var(--text-muted);">Partner ID: #${p.id}</span>
                            </div>
                        </div>
                    </td>
                    <td><strong>${AdminApp.escapeHtml(p.phone || 'N/A')}</strong></td>
                    <td><span style="font-family: monospace; font-weight: 700;">${AdminApp.escapeHtml(p.vehicle_number || 'N/A')}</span></td>
                    <td>${availBadge}</td>
                    <td>
                        <a href="orders.html" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                            📦 Assign Orders
                        </a>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    },

    renderZonesTable(zones) {
        const tableBody = document.getElementById('zones-table-body');
        if (!tableBody) return;

        if (zones.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">No delivery zones defined.</td>
                </tr>
            `;
            return;
        }

        const rows = zones.map(z => {
            return `
                <tr>
                    <td><strong>${AdminApp.escapeHtml(z.zone_name)}</strong></td>
                    <td>${parseFloat(z.min_distance).toFixed(1)} - ${parseFloat(z.max_distance).toFixed(1)} km</td>
                    <td><strong>₹${parseFloat(z.delivery_charge).toFixed(2)}</strong></td>
                    <td>₹${parseFloat(z.min_order_amount).toFixed(2)}</td>
                    <td><span class="order-badge status-delivered">${AdminApp.escapeHtml((z.status || 'active').toUpperCase())}</span></td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    }
};
