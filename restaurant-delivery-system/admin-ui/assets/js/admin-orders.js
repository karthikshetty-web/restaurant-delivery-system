/**
 * Kudla Kitchen - Admin Orders Management Application Script
 * Real-time database management for Admin Orders, Status Updates, Modal details & Rider Assignment.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-orders-container')) {
        AdminOrders.init();
    }
});

const AdminOrders = {
    state: {
        orders: [],
        filteredOrders: [],
        deliveryPartners: [],
        selectedOrderDetails: null,
        searchQuery: '',
        statusFilter: 'all',
        paymentFilter: 'all'
    },

    async init() {
        this.bindEvents();
        await Promise.all([
            this.loadOrders(),
            this.loadDeliveryPartners()
        ]);
    },

    bindEvents() {
        const searchInput = document.getElementById('order-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        const statusSelect = document.getElementById('order-status-filter');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.state.statusFilter = e.target.value;
                this.applyFilters();
            });
        }

        const paymentSelect = document.getElementById('order-payment-filter');
        if (paymentSelect) {
            paymentSelect.addEventListener('change', (e) => {
                this.state.paymentFilter = e.target.value;
                this.applyFilters();
            });
        }

        const refreshBtn = document.getElementById('refresh-orders-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                AdminApp.showToast('Refreshing real-time orders...', 'info');
                this.loadOrders();
            });
        }
    },

    async loadOrders() {
        const tableBody = document.getElementById('orders-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔄</div>
                    <div style="color: var(--text-muted); font-weight: 600;">Fetching live orders from database...</div>
                </td>
            </tr>
        `;

        const response = await AdminAPI.getOrders();
        
        if (!response.success || !Array.isArray(response.data)) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #dc2626;">⚠️</div>
                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.3rem;">Failed to load Orders</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">${AdminApp.escapeHtml(response.message || 'Check database & admin access token.')}</div>
                        <button onclick="AdminOrders.loadOrders()" class="btn btn-secondary" style="margin-top: 1rem;">Retry Loading</button>
                    </td>
                </tr>
            `;
            return;
        }

        this.state.orders = response.data;
        this.applyFilters();
    },

    async loadDeliveryPartners() {
        try {
            const res = await AdminAPI.getDeliveryLogistics();
            if (res.success && res.data && Array.isArray(res.data.partners)) {
                this.state.deliveryPartners = res.data.partners;
            }
        } catch (e) {
            console.warn('Failed to pre-fetch delivery partners:', e);
        }
    },

    applyFilters() {
        const { orders, searchQuery, statusFilter, paymentFilter } = this.state;

        let filtered = orders.filter(o => {
            // Search query check (Order #, Customer Name, City, Order ID)
            const orderNum = (o.order_number || '').toLowerCase();
            const customerName = (o.customer_name || '').toLowerCase();
            const city = (o.city || '').toLowerCase();
            const orderId = String(o.id);

            const matchesSearch = !searchQuery || 
                orderNum.includes(searchQuery) || 
                customerName.includes(searchQuery) || 
                city.includes(searchQuery) || 
                orderId === searchQuery;

            // Status filter check
            const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;

            // Payment filter check
            const matchesPayment = paymentFilter === 'all' || (o.payment_status || '').toLowerCase() === paymentFilter.toLowerCase();

            return matchesSearch && matchesStatus && matchesPayment;
        });

        this.state.filteredOrders = filtered;
        this.updateKpiCounters();
        this.renderOrdersTable(filtered);
    },

    updateKpiCounters() {
        const orders = this.state.orders;
        
        const totalCount = orders.length;
        const pendingCount = orders.filter(o => o.order_status === 'pending').length;
        const preparingCount = orders.filter(o => o.order_status === 'confirmed' || o.order_status === 'preparing').length;
        const deliveredCount = orders.filter(o => o.order_status === 'delivered').length;
        const cancelledCount = orders.filter(o => o.order_status === 'cancelled').length;

        const totalEl = document.getElementById('stat-total-orders');
        const pendingEl = document.getElementById('stat-pending-orders');
        const prepEl = document.getElementById('stat-preparing-orders');
        const deliveredEl = document.getElementById('stat-delivered-orders');
        const cancelledEl = document.getElementById('stat-cancelled-orders');

        if (totalEl) totalEl.innerText = totalCount;
        if (pendingEl) pendingEl.innerText = pendingCount;
        if (prepEl) prepEl.innerText = preparingCount;
        if (deliveredEl) deliveredEl.innerText = deliveredCount;
        if (cancelledEl) cancelledEl.innerText = cancelledCount;
    },

    renderOrdersTable(orders) {
        const tableBody = document.getElementById('orders-table-body');
        if (!tableBody) return;

        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                        <div style="font-weight: 700; color: var(--text-primary);">No Orders Found</div>
                        <div style="color: var(--text-muted); font-size: 0.88rem;">No orders match your current filter or search criteria.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = orders.map(o => {
            const badge = AdminApp.getOrderStatusBadge(o.order_status);
            const dateStr = o.created_at ? new Date(o.created_at).toLocaleString() : 'N/A';
            const amount = parseFloat(o.final_amount || o.total_amount || 0).toFixed(2);
            const payStatus = (o.payment_status || 'pending').toUpperCase();
            const payBadgeClass = payStatus === 'PAID' ? 'background: rgba(34,197,94,0.15); color: #2e7d32;' : 'background: rgba(234,179,8,0.15); color: #b45309;';

            return `
                <tr>
                    <td><strong>${AdminApp.escapeHtml(o.order_number || `#ORD-${o.id}`)}</strong></td>
                    <td>
                        <div style="font-weight: 700;">${AdminApp.escapeHtml(o.customer_name || 'Customer')}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${AdminApp.escapeHtml(o.city || 'N/A')}</div>
                    </td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${dateStr}</span></td>
                    <td><strong>₹${amount}</strong></td>
                    <td>
                        <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; ${payBadgeClass}">
                            ${AdminApp.escapeHtml(payStatus)} (${AdminApp.escapeHtml(o.payment_method || 'COD')})
                        </span>
                    </td>
                    <td>
                        <span class="order-badge ${badge.class}">${badge.icon} ${badge.label}</span>
                    </td>
                    <td>
                        <button onclick="AdminOrders.viewOrderDetails(${o.id})" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;">
                            👁️ Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
    },

    async viewOrderDetails(orderId) {
        AdminApp.showToast(`Loading order details #${orderId}...`, 'info');

        const res = await AdminAPI.getOrderDetails(orderId);
        if (!res.success || !res.data) {
            AdminApp.showToast(res.message || 'Could not fetch order details', 'error');
            return;
        }

        const order = res.data;
        this.state.selectedOrderDetails = order;

        this.renderOrderModal(order);
    },

    renderOrderModal(order) {
        let modal = document.getElementById('order-detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'order-detail-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        const badge = AdminApp.getOrderStatusBadge(order.order_status);
        const dateStr = order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A';
        const subtotal = parseFloat(order.total_amount || 0).toFixed(2);
        const discount = parseFloat(order.discount_amount || 0).toFixed(2);
        const deliveryCharge = parseFloat(order.delivery_charge || 0).toFixed(2);
        const taxAmount = parseFloat(order.tax_amount || 0).toFixed(2);
        const grandTotal = parseFloat(order.final_amount || 0).toFixed(2);

        // Render Order Items
        const itemsHtml = (order.items || []).map(item => `
            <tr>
                <td>
                    <div style="font-weight: 700;">${AdminApp.escapeHtml(item.food_name)}</div>
                </td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${parseFloat(item.price).toFixed(2)}</td>
                <td style="text-align: right; font-weight: 700;">₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        // Allowed transitions based on order_helper.php
        const allowedTransitions = this.getAllowedTransitions(order.order_status);
        
        let statusOptionsHtml = `<option value="" disabled selected>Change Status...</option>`;
        if (allowedTransitions.length === 0) {
            statusOptionsHtml = `<option value="" disabled selected>No transitions available (${badge.label})</option>`;
        } else {
            allowedTransitions.forEach(st => {
                const conf = AdminApp.getOrderStatusBadge(st);
                statusOptionsHtml += `<option value="${st}">${conf.icon} Mark as ${conf.label}</option>`;
            });
        }

        // Delivery Partner assignment HTML
        const isDeliveryAssigned = order.delivery && order.delivery.rider_name;
        const partners = this.state.deliveryPartners;
        
        let riderOptionsHtml = `<option value="" disabled selected>Select Delivery Rider...</option>`;
        partners.forEach(p => {
            const isSelected = order.delivery && order.delivery.delivery_partner_id == p.id ? 'selected' : '';
            riderOptionsHtml += `<option value="${p.id}" ${isSelected}>${AdminApp.escapeHtml(p.name)} (${AdminApp.escapeHtml(p.phone)}) - ${AdminApp.escapeHtml(p.vehicle_number || 'Bike')}</option>`;
        });

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.6rem;">
                            <span>📦 Order Details:</span>
                            <span style="color: var(--accent-primary);">${AdminApp.escapeHtml(order.order_number || `#ORD-${order.id}`)}</span>
                        </h2>
                        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">Placed on ${dateStr}</div>
                    </div>
                    <button onclick="AdminOrders.closeModal()" class="btn-close" title="Close Modal">✕</button>
                </div>

                <div class="modal-body">
                    <!-- Status Banner Strip -->
                    <div style="background: var(--bg-surface); border-radius: var(--radius-md); padding: 1rem 1.2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                        <div>
                            <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Current Order Status</span>
                            <span class="order-badge ${badge.class}" style="font-size: 0.95rem; padding: 0.35rem 0.8rem; margin-top: 0.3rem;">
                                ${badge.icon} ${badge.label}
                            </span>
                        </div>

                        <!-- Status Action Controls -->
                        <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
                            ${allowedTransitions.length > 0 ? `
                                <select id="modal-status-select" class="select-input">
                                    ${statusOptionsHtml}
                                </select>
                                <button onclick="AdminOrders.handleStatusChangeFromModal(${order.id})" class="btn btn-primary" style="padding: 0.55rem 1rem;">
                                    Update Status
                                </button>
                            ` : `<span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">Status Finalized</span>`}

                            ${(order.order_status === 'pending' || order.order_status === 'confirmed') ? `
                                <button onclick="AdminOrders.confirmCancelOrder(${order.id})" class="btn btn-secondary" style="color: #dc2626; border-color: rgba(220,38,38,0.3); padding: 0.55rem 1rem;">
                                    ❌ Cancel Order
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Detail Cards Grid -->
                    <div class="order-detail-grid">
                        <!-- Customer & Delivery Address Card -->
                        <div class="detail-card">
                            <h4>👤 Customer & Delivery Info</h4>
                            <div class="detail-row">
                                <span class="detail-label">Recipient Name:</span>
                                <span class="detail-value">${AdminApp.escapeHtml(order.recipient_name || 'N/A')}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${AdminApp.escapeHtml(order.phone || 'N/A')}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Address:</span>
                                <span class="detail-value" style="max-width: 180px;">${AdminApp.escapeHtml(order.address || 'N/A')}, ${AdminApp.escapeHtml(order.area || '')}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">City / Pincode:</span>
                                <span class="detail-value">${AdminApp.escapeHtml(order.city || '')} - ${AdminApp.escapeHtml(order.pincode || '')}</span>
                            </div>
                        </div>

                        <!-- Payment Info Card -->
                        <div class="detail-card">
                            <h4>💳 Payment Information</h4>
                            <div class="detail-row">
                                <span class="detail-label">Payment Status:</span>
                                <span class="detail-value" style="color: ${order.payment_status === 'paid' ? 'var(--accent-secondary)' : '#b45309'}; text-transform: uppercase;">
                                    ${AdminApp.escapeHtml((order.payment_status || 'pending'))}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Payment Method:</span>
                                <span class="detail-value">${AdminApp.escapeHtml(order.payment_method || 'COD')}</span>
                            </div>
                            ${order.payment && order.payment.transaction_id ? `
                                <div class="detail-row">
                                    <span class="detail-label">Transaction ID:</span>
                                    <span class="detail-value" style="font-size: 0.8rem; font-family: monospace;">${AdminApp.escapeHtml(order.payment.transaction_id)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Delivery Rider Assignment Section -->
                    <div class="detail-card" style="margin-bottom: 1.5rem;">
                        <h4>🚴 Delivery Partner Assignment</h4>
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                            <div>
                                ${isDeliveryAssigned ? `
                                    <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-secondary);">
                                        Assigned to: ${AdminApp.escapeHtml(order.delivery.rider_name)} (${AdminApp.escapeHtml(order.delivery.rider_phone)})
                                    </div>
                                    <div style="font-size: 0.82rem; color: var(--text-muted);">
                                        Status: <strong>${AdminApp.escapeHtml(order.delivery.delivery_status || 'assigned')}</strong>
                                    </div>
                                ` : `
                                    <div style="font-size: 0.9rem; color: var(--text-muted); font-style: italic;">
                                        No delivery partner assigned yet for this order.
                                    </div>
                                `}
                            </div>

                            <div style="display: flex; align-items: center; gap: 0.6rem;">
                                <select id="modal-rider-select" class="select-input" style="max-width: 240px;">
                                    ${riderOptionsHtml}
                                </select>
                                <button onclick="AdminOrders.handleAssignRiderFromModal(${order.id})" class="btn btn-secondary" style="padding: 0.55rem 0.9rem;">
                                    ${isDeliveryAssigned ? 'Re-assign Rider' : 'Assign Rider'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Special Instructions if any -->
                    ${order.notes ? `
                        <div style="background: rgba(230,81,0,0.08); border-left: 4px solid var(--accent-primary); padding: 0.9rem 1.2rem; border-radius: 4px; margin-bottom: 1.5rem;">
                            <strong style="display: block; font-size: 0.82rem; text-transform: uppercase; color: var(--accent-primary);">📝 Special Delivery Instructions:</strong>
                            <p style="font-size: 0.9rem; color: var(--text-primary); margin-top: 0.2rem;">${AdminApp.escapeHtml(order.notes)}</p>
                        </div>
                    ` : ''}

                    <!-- Items Table -->
                    <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.5px;">
                        🍕 Ordered Items (${(order.items || []).length})
                    </h4>
                    <div class="table-responsive">
                        <table class="order-items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style="text-align: center;">Qty</th>
                                    <th style="text-align: right;">Unit Price</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <!-- Financial Summary Breakdown -->
                    <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
                        <div style="width: 100%; max-width: 320px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.2rem;">
                            <div class="detail-row">
                                <span class="detail-label">Subtotal:</span>
                                <span class="detail-value">₹${subtotal}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Discount:</span>
                                <span class="detail-value" style="color: var(--accent-secondary);">-₹${discount}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivery Charge:</span>
                                <span class="detail-value">₹${deliveryCharge}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Tax (GST 5%):</span>
                                <span class="detail-value">₹${taxAmount}</span>
                            </div>
                            <div class="detail-row" style="border-top: 2px solid var(--border-color); padding-top: 0.6rem; margin-top: 0.6rem; font-size: 1.1rem;">
                                <strong style="color: var(--text-primary);">Grand Total:</strong>
                                <strong style="color: var(--accent-primary);">₹${grandTotal}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button onclick="AdminOrders.closeModal()" class="btn btn-secondary">Close Details</button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    getAllowedTransitions(currentStatus) {
        const map = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready'],
            'ready': ['out_for_delivery'],
            'out_for_delivery': ['delivered'],
            'delivered': [],
            'cancelled': []
        };
        return map[currentStatus] || [];
    },

    async handleStatusChangeFromModal(orderId) {
        const select = document.getElementById('modal-status-select');
        if (!select || !select.value) {
            AdminApp.showToast('Please select a valid new order status.', 'error');
            return;
        }

        const newStatus = select.value;
        const res = await AdminAPI.updateOrderStatus(orderId, newStatus);
        
        if (res.success) {
            AdminApp.showToast(res.message || 'Order status updated successfully!', 'success');
            // Refresh order list and view details
            await this.loadOrders();
            await this.viewOrderDetails(orderId);
        } else {
            AdminApp.showToast(res.message || 'Failed to update order status.', 'error');
        }
    },

    async handleAssignRiderFromModal(orderId) {
        const select = document.getElementById('modal-rider-select');
        if (!select || !select.value) {
            AdminApp.showToast('Please select a delivery partner to assign.', 'error');
            return;
        }

        const partnerId = select.value;
        const res = await AdminAPI.assignDeliveryPartner(orderId, partnerId);

        if (res.success) {
            AdminApp.showToast('Delivery partner assigned successfully!', 'success');
            await this.loadOrders();
            await this.viewOrderDetails(orderId);
        } else {
            AdminApp.showToast(res.message || 'Failed to assign delivery partner.', 'error');
        }
    },

    confirmCancelOrder(orderId) {
        if (confirm(`Are you sure you want to CANCEL Order #${orderId}? This action will mark the order as cancelled.`)) {
            this.handleCancelOrder(orderId);
        }
    },

    async handleCancelOrder(orderId) {
        const res = await AdminAPI.cancelOrder(orderId);

        if (res.success) {
            AdminApp.showToast('Order cancelled successfully!', 'success');
            await this.loadOrders();
            await this.viewOrderDetails(orderId);
        } else {
            AdminApp.showToast(res.message || 'Could not cancel order.', 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('order-detail-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
};
