/**
 * Kudla Kitchen - Delivery Partner Orders Queue & Status Update Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('delivery-orders-container')) {
        DeliveryOrders.init();
    }
});

const DeliveryOrders = {
    state: {
        orders: [],
        filterTab: 'active' // 'active' or 'completed'
    },

    init() {
        this.bindEvents();
        this.loadOrders();
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-delivery-orders-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                DeliveryApp.showToast('Refreshing assigned orders...', 'info');
                this.loadOrders();
            });
        }

        const tabActive = document.getElementById('tab-active-orders');
        const tabCompleted = document.getElementById('tab-completed-orders');

        if (tabActive && tabCompleted) {
            tabActive.addEventListener('click', () => {
                this.state.filterTab = 'active';
                tabActive.classList.add('active');
                tabCompleted.classList.remove('active');
                this.renderOrders();
            });

            tabCompleted.addEventListener('click', () => {
                this.state.filterTab = 'completed';
                tabCompleted.classList.add('active');
                tabActive.classList.remove('active');
                this.renderOrders();
            });
        }
    },

    async loadOrders() {
        const container = document.getElementById('delivery-orders-list');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚴</div>
                <div>Fetching assigned deliveries...</div>
            </div>
        `;

        const res = await DeliveryAPI.getMyOrders();
        if (!res.success || !Array.isArray(res.data)) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-lg);">
                    <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                    <h3>Failed to load assigned orders</h3>
                    <p style="color: var(--text-muted);">${DeliveryApp.escapeHtml(res.message || '')}</p>
                    <button onclick="DeliveryOrders.loadOrders()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
            return;
        }

        this.state.orders = res.data;
        this.renderOrders();
    },

    renderOrders() {
        const container = document.getElementById('delivery-orders-list');
        if (!container) return;

        const { orders, filterTab } = this.state;

        const filtered = orders.filter(o => {
            const isDelivered = o.delivery_status === 'delivered';
            return filterTab === 'completed' ? isDelivered : !isDelivered;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 2px dashed var(--border-color);">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">📦</div>
                    <h3>${filterTab === 'completed' ? 'No Completed Deliveries Yet' : 'No Active Assigned Orders'}</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.3rem;">
                        ${filterTab === 'completed' ? 'Completed order history will appear here.' : 'When restaurant admins assign new orders to you, they will show up here.'}
                    </p>
                </div>
            `;
            return;
        }

        const cards = filtered.map(o => {
            const status = o.delivery_status || 'assigned';
            const customerName = o.recipient_name || o.customer_name || 'Customer';
            const customerPhone = o.recipient_phone || o.customer_phone || '';
            const fullAddress = `${o.address || ''}, ${o.area || ''}, ${o.city || ''} - ${o.pincode || ''}`;
            const amount = parseFloat(o.final_amount || 0).toFixed(2);

            let statusActionHtml = '';

            if (status === 'assigned') {
                statusActionHtml = `
                    <button onclick="DeliveryOrders.updateStatus(${o.order_id}, 'picked_up')" class="btn btn-primary btn-block" style="background: #a855f7;">
                        🛍️ Mark Picked Up from Kitchen
                    </button>
                `;
            } else if (status === 'picked_up') {
                statusActionHtml = `
                    <button onclick="DeliveryOrders.updateStatus(${o.order_id}, 'out_for_delivery')" class="btn btn-primary btn-block">
                        🚴 Start Out for Delivery
                    </button>
                `;
            } else if (status === 'out_for_delivery') {
                statusActionHtml = `
                    <button onclick="DeliveryOrders.updateStatus(${o.order_id}, 'delivered')" class="btn btn-primary btn-block" style="background: #22c55e;">
                        ✅ Mark Delivered to Customer
                    </button>
                `;
            } else if (status === 'delivered') {
                statusActionHtml = `
                    <div style="text-align: center; padding: 0.75rem; background: rgba(34,197,94,0.15); color: #22c55e; border-radius: var(--radius-md); font-weight: 800;">
                        ✅ Successfully Delivered
                    </div>
                `;
            }

            return `
                <div class="delivery-card">
                    <div class="delivery-card-header">
                        <div>
                            <span class="delivery-order-num">${DeliveryApp.escapeHtml(o.order_number || `#ORD-${o.order_id}`)}</span>
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.1rem;">Order #${o.order_id}</div>
                        </div>
                        <div>
                            <span class="order-badge status-${status}">${status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                    </div>

                    <!-- Customer & Address Information Box -->
                    <div class="customer-info-box">
                        <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.4rem; display: flex; align-items: center; justify-content: space-between;">
                            <span>👤 ${DeliveryApp.escapeHtml(customerName)}</span>
                            ${customerPhone ? `
                                <a href="tel:${DeliveryApp.escapeHtml(customerPhone)}" class="btn btn-secondary" style="padding: 0.3rem 0.7rem; font-size: 0.8rem; color: var(--accent-primary);">
                                    📞 Call Customer
                                </a>
                            ` : ''}
                        </div>

                        <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                            📍 <strong>Address:</strong> ${DeliveryApp.escapeHtml(fullAddress)}
                        </div>

                        <div style="font-size: 0.88rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
                            <span>💰 Collect Amount: <strong style="color: var(--accent-primary);">₹${amount}</strong></span>
                        </div>
                    </div>

                    <!-- Delivery Status Actions -->
                    <div>
                        ${statusActionHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    },

    async updateStatus(orderId, newStatus) {
        DeliveryApp.showToast(`Updating delivery status for order #${orderId}...`, 'info');
        const res = await DeliveryAPI.updateDeliveryStatus(orderId, newStatus);

        if (res.success) {
            DeliveryApp.showToast(`Delivery status updated to '${newStatus}'!`, 'success');
            await this.loadOrders();
        } else {
            DeliveryApp.showToast(res.message || 'Failed to update delivery status', 'error');
        }
    }
};
