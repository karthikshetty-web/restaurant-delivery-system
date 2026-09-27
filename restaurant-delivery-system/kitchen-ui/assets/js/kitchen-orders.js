/**
 * Kudla Kitchen - Kitchen Order Queue Display Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kitchen-orders-queue')) {
        KitchenOrders.init();
    }
});

const KitchenOrders = {
    state: {
        orders: [],
        autoRefreshInterval: null,
        lastUpdated: null
    },

    init() {
        this.bindEvents();
        this.loadOrders();
        // Auto-refresh every 15 seconds for live kitchen display
        this.state.autoRefreshInterval = setInterval(() => {
            this.loadOrders(true);
        }, 15000);
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-queue-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                KitchenApp.showToast('Refreshing kitchen tickets...', 'info');
                this.loadOrders();
            });
        }
    },

    async loadOrders(isSilent = false) {
        const container = document.getElementById('kitchen-orders-queue');
        if (!container) return;

        if (!isSilent) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; grid-column: 1 / -1;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍🍳</div>
                    <h3>Loading kitchen ticket queue...</h3>
                </div>
            `;
        }

        const res = await KitchenAPI.getOrders();
        if (!res.success || !Array.isArray(res.data)) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; grid-column: 1 / -1;">
                    <div style="font-size: 2rem; color: #dc2626;">⚠️</div>
                    <h3>Failed to load tickets</h3>
                    <p style="color: var(--text-muted);">${KitchenApp.escapeHtml(res.message || '')}</p>
                    <button onclick="KitchenOrders.loadOrders()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
            return;
        }

        this.state.orders = res.data;
        this.state.lastUpdated = new Date();
        this.updateLastUpdatedDisplay();
        this.renderQueue(res.data);
    },

    updateLastUpdatedDisplay() {
        const el = document.getElementById('last-updated-time');
        if (el && this.state.lastUpdated) {
            el.innerText = `Updated at ${this.state.lastUpdated.toLocaleTimeString()}`;
        }
    },

    renderQueue(orders) {
        const container = document.getElementById('kitchen-orders-queue');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 5rem; grid-column: 1 / -1; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 2px dashed var(--border-color);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                    <h2 style="font-size: 1.5rem; font-weight: 800;">All Kitchen Tickets Clear!</h2>
                    <p style="color: var(--text-muted); margin-top: 0.5rem;">No active tickets in queue. New customer orders will appear automatically.</p>
                </div>
            `;
            return;
        }

        const cards = orders.map(ord => {
            const status = ord.order_status;
            let actionBtnHtml = '';

            if (status === 'confirmed') {
                actionBtnHtml = `
                    <button onclick="KitchenOrders.updateStatus(${ord.id}, 'preparing')" class="btn btn-primary btn-lg" style="background: #a855f7;">
                        👨‍🍳 Start Preparing
                    </button>
                `;
            } else if (status === 'preparing') {
                actionBtnHtml = `
                    <button onclick="KitchenOrders.updateStatus(${ord.id}, 'ready')" class="btn btn-primary btn-lg" style="background: #22c55e;">
                        🛍️ Mark Ready for Pickup
                    </button>
                `;
            } else if (status === 'ready') {
                actionBtnHtml = `
                    <div style="text-align: center; padding: 0.6rem; background: rgba(34,197,94,0.15); color: #22c55e; border-radius: var(--radius-md); font-weight: 800; font-size: 0.95rem;">
                        ✅ Ready for Pickup / Delivery
                    </div>
                `;
            }

            const itemsHtml = (ord.items || []).map(item => `
                <li class="ticket-item">
                    <span>${KitchenApp.escapeHtml(item.food_name)}</span>
                    <span class="ticket-item-qty">x${item.quantity}</span>
                </li>
            `).join('');

            const timeStr = new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="ticket-card status-${status}">
                    <div>
                        <div class="ticket-header">
                            <div>
                                <span class="ticket-number">${KitchenApp.escapeHtml(ord.order_number)}</span>
                                <div style="font-size: 0.78rem; color: var(--text-muted);">Ticket #${ord.id}</div>
                            </div>
                            <div style="text-align: right;">
                                <span class="order-badge status-${status}">${status.toUpperCase()}</span>
                                <div class="ticket-time" style="margin-top: 0.3rem;">🕒 ${timeStr}</div>
                            </div>
                        </div>

                        ${ord.special_instructions ? `
                            <div class="special-instruction-box">
                                📝 <strong>Special Note:</strong> ${KitchenApp.escapeHtml(ord.special_instructions)}
                            </div>
                        ` : ''}

                        <ul class="ticket-items-list">
                            ${itemsHtml}
                        </ul>
                    </div>

                    <div class="ticket-actions" style="margin-top: 1rem;">
                        ${actionBtnHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    },

    async updateStatus(orderId, newStatus) {
        KitchenApp.showToast(`Updating ticket #${orderId} to '${newStatus}'...`, 'info');
        const res = await KitchenAPI.updateOrderStatus(orderId, newStatus);
        
        if (res.success) {
            KitchenApp.showToast(`Ticket #${orderId} updated to '${newStatus}'!`, 'success');
            await this.loadOrders();
        } else {
            KitchenApp.showToast(res.message || 'Failed to update ticket status', 'error');
        }
    }
};
