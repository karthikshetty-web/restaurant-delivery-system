/**
 * Kudla Kitchen - Customer Frontend App Script
 * Manages UI interactions, Theme switcher, Toast notifications, Cart, Checkout, Orders history & tracking, Modal details, and API rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    state: {
        categories: [],
        foodItems: [],
        cartData: null,
        addresses: [],
        orders: [],
        selectedOrderFilter: 'all',
        selectedAddressId: null,
        appliedCoupon: null,
        deliveryCharge: 0.00,
        selectedPaymentMethod: 'COD',
        isSubmittingOrder: false,
        selectedCategoryId: 0,
        searchQuery: '',
        searchDebounceTimer: null,
        modalQuantity: 1,
        activeModalFoodId: null
    },

    async init() {
        this.initTheme();
        
        // Verify profile if token exists
        if (API.isLoggedIn()) {
            await API.getProfile();
            this.updateCartCount();
        }

        this.initNavbar();
        this.initEventListeners();

        // Page specific initializers
        if (document.getElementById('categories-container')) {
            this.loadCategories();
        }
        if (document.getElementById('food-container')) {
            this.loadFoodItems();
        }
        if (document.getElementById('cart-page-container')) {
            this.loadCartPage();
        }
        if (document.getElementById('checkout-page-container')) {
            this.loadCheckoutPage();
        }
        if (document.getElementById('orders-page-container')) {
            this.loadOrdersPage();
        }
    },

    /* --- Theme Manager --- */
    initTheme() {
        const savedTheme = localStorage.getItem('kk_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kk_theme', newTheme);
        this.updateThemeToggleIcon(newTheme);
    },

    updateThemeToggleIcon(theme) {
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        }
    },

    /* --- Cart Counter Helper --- */
    async updateCartCount() {
        if (!API.isLoggedIn()) return;
        try {
            const response = await API.getCart();
            if (response.success && response.data && Array.isArray(response.data.items)) {
                const totalItems = response.data.items.reduce((sum, item) => sum + parseInt(item.quantity, 10), 0);
                const badges = document.querySelectorAll('.cart-badge');
                badges.forEach(badge => {
                    badge.textContent = totalItems;
                    badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
                });
            } else {
                const badges = document.querySelectorAll('.cart-badge');
                badges.forEach(badge => badge.style.display = 'none');
            }
        } catch (e) {
            console.warn('Unable to update cart badge:', e);
        }
    },

    /* --- Navbar & Auth UI State --- */
    initNavbar() {
        const authContainer = document.getElementById('nav-auth-container');
        const mobileAuthContainer = document.getElementById('mobile-nav-auth');
        const user = API.getUser();

        const isInSubfolder = window.location.pathname.includes('/customer/');
        const customerPath = isInSubfolder ? './' : 'customer/';

        let authHtml = '';
        let mobileAuthHtml = '';

        if (API.isLoggedIn() && user) {
            const firstName = this.escapeHtml(user.name.split(' ')[0]);
            authHtml = `
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-weight: 600; font-size: 0.9rem;">👋 Hi, ${firstName}</span>
                    <button onclick="App.logout()" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">Logout</button>
                </div>
            `;
            mobileAuthHtml = `
                <div style="padding: 0.5rem 0;">
                    <p style="font-weight: 700; color: var(--text-primary);">Account: ${this.escapeHtml(user.name)}</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem;">${this.escapeHtml(user.email)}</p>
                    <button onclick="App.logout(); return false;" class="btn btn-secondary" style="width: 100%;">Logout</button>
                </div>
            `;
        } else {
            authHtml = `
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <a href="${customerPath}login.html" class="nav-link" style="font-weight: 600;">Sign In</a>
                    <a href="${customerPath}register.html" class="auth-btn">Register</a>
                </div>
            `;
            mobileAuthHtml = `
                <div style="display: flex; flex-direction: column; gap: 0.6rem; padding-top: 0.5rem;">
                    <a href="${customerPath}login.html" class="btn btn-secondary" style="width: 100%; text-align: center;">Sign In</a>
                    <a href="${customerPath}register.html" class="auth-btn" style="width: 100%; text-align: center; display: block;">Register</a>
                </div>
            `;
        }

        if (authContainer) authContainer.innerHTML = authHtml;
        if (mobileAuthContainer) mobileAuthContainer.innerHTML = mobileAuthHtml;
    },

    async logout() {
        this.showToast('Logging out...', 'info');
        await API.logout();
        this.showToast('Successfully logged out.', 'success');
        this.initNavbar();

        setTimeout(() => {
            const isInSubfolder = window.location.pathname.includes('/customer/');
            window.location.href = isInSubfolder ? '../index.html' : 'index.html';
        }, 800);
    },

    /* --- Event Listeners --- */
    initEventListeners() {
        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile drawer toggle
        const mobileBtn = document.getElementById('mobile-toggle-btn');
        const drawer = document.getElementById('mobile-drawer');
        if (mobileBtn && drawer) {
            mobileBtn.addEventListener('click', () => {
                drawer.classList.toggle('open');
            });
        }

        // Live Search Input
        const searchInput = document.getElementById('food-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.state.searchDebounceTimer);
                this.state.searchQuery = e.target.value;
                this.state.searchDebounceTimer = setTimeout(() => {
                    this.loadFoodItems();
                }, 350);
            });
        }

        // Modal close backdrop
        const modalBackdrop = document.getElementById('food-modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    this.closeFoodModal();
                }
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

    /* --- Customer Orders Module (Step 6) --- */
    async loadOrdersPage() {
        const container = document.getElementById('orders-page-container');
        if (!container) return;

        const isInSubfolder = window.location.pathname.includes('/customer/');
        const loginUrl = isInSubfolder ? 'login.html' : 'customer/login.html';
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';

        if (!API.isLoggedIn()) {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">🔒</div>
                    <div class="state-title">Sign In Required</div>
                    <div class="state-desc">Please log in to view your order history and track active deliveries.</div>
                    <div style="margin-top: 1rem;">
                        <a href="${loginUrl}" class="btn btn-primary">Sign In Now ➔</a>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="state-box" style="margin: 3rem 0;">
                <div class="skeleton" style="height: 220px; width: 100%;"></div>
            </div>
        `;

        const response = await API.getOrders();

        if (response.success && Array.isArray(response.data)) {
            this.state.orders = response.data;
            this.renderOrdersUI(container, menuUrl);
        } else {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">⚠️</div>
                    <div class="state-title">Unable to fetch your orders</div>
                    <div class="state-desc">${this.escapeHtml(response.message || 'Error communicating with PHP backend.')}</div>
                    <button onclick="App.loadOrdersPage()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
        }
    },

    renderOrdersUI(container, menuUrl) {
        const orders = this.state.orders;
        const filter = this.state.selectedOrderFilter;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">📦</div>
                    <div class="state-title">No Orders Yet</div>
                    <div class="state-desc">You haven't placed any food orders with Kudla Kitchen yet.</div>
                    <div style="margin-top: 1.5rem;">
                        <a href="${menuUrl}" class="btn btn-primary">Browse Menu & Order ➔</a>
                    </div>
                </div>
            `;
            return;
        }

        // Filter orders
        const filteredOrders = orders.filter(o => {
            if (filter === 'active') return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.order_status);
            if (filter === 'completed') return o.order_status === 'delivered';
            if (filter === 'cancelled') return o.order_status === 'cancelled';
            return true;
        });

        const cardsHtml = filteredOrders.map(order => {
            const statusConfig = this.getOrderStatusBadge(order.order_status);
            const formattedDate = new Date(order.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const isPending = order.order_status === 'pending';

            return `
                <div class="order-history-card">
                    <div class="order-card-header">
                        <div>
                            <span class="order-number">${this.escapeHtml(order.order_number)}</span>
                            <span class="order-date">📅 ${formattedDate}</span>
                        </div>
                        <div class="order-badge ${statusConfig.class}">
                            ${statusConfig.icon} ${statusConfig.label}
                        </div>
                    </div>

                    <div class="order-card-body">
                        <div class="order-stat-col">
                            <span class="order-stat-label">Total Amount</span>
                            <strong class="order-stat-val">₹${parseFloat(order.final_amount).toFixed(2)}</strong>
                        </div>
                        <div class="order-stat-col">
                            <span class="order-stat-label">Payment Status</span>
                            <span class="payment-badge payment-${order.payment_status}">${order.payment_status.toUpperCase()} (${order.payment_status === 'paid' ? 'Paid' : 'Due'})</span>
                        </div>
                        <div class="order-stat-col">
                            <span class="order-stat-label">Order Stage</span>
                            <span style="font-size: 0.9rem; font-weight: 600;">${statusConfig.label}</span>
                        </div>
                    </div>

                    <div class="order-card-footer">
                        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                            <button onclick="App.openOrderModal(${order.id})" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
                                🔍 View Details & Track
                            </button>
                            <button onclick="App.refreshOrder(${order.id})" class="btn btn-secondary" style="padding: 0.45rem 0.8rem; font-size: 0.85rem;" title="Refresh order status">
                                🔄 Refresh
                            </button>
                        </div>
                        ${isPending ? `
                            <button onclick="App.handleCancelOrder(${order.id})" class="btn btn-secondary" style="padding: 0.45rem 0.9rem; font-size: 0.85rem; color: #dc2626; border-color: rgba(220,38,38,0.3);">
                                ❌ Cancel Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <!-- Filter Tabs -->
            <div class="food-controls" style="margin-bottom: 2rem;">
                <div class="category-tabs">
                    <button onclick="App.filterOrders('all')" class="tab-btn ${filter === 'all' ? 'active' : ''}">All Orders (${orders.length})</button>
                    <button onclick="App.filterOrders('active')" class="tab-btn ${filter === 'active' ? 'active' : ''}">Active Deliveries</button>
                    <button onclick="App.filterOrders('completed')" class="tab-btn ${filter === 'completed' ? 'active' : ''}">Delivered</button>
                    <button onclick="App.filterOrders('cancelled')" class="tab-btn ${filter === 'cancelled' ? 'active' : ''}">Cancelled</button>
                </div>
                <button onclick="App.loadOrdersPage()" class="btn btn-secondary" style="font-size: 0.85rem;">🔄 Refresh All</button>
            </div>

            <!-- Orders Cards List -->
            <div class="orders-list-grid">
                ${filteredOrders.length > 0 ? cardsHtml : `<div class="state-box"><div class="state-desc">No orders found matching this filter.</div></div>`}
            </div>
        `;
    },

    filterOrders(filterName) {
        this.state.selectedOrderFilter = filterName;
        const container = document.getElementById('orders-page-container');
        const isInSubfolder = window.location.pathname.includes('/customer/');
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
        this.renderOrdersUI(container, menuUrl);
    },

    async refreshOrder(orderId) {
        this.showToast('Refreshing status...', 'info');
        await this.loadOrdersPage();
        this.showToast('Order status updated.', 'success');
    },

    async handleCancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        const response = await API.cancelOrder(orderId);
        if (response.success) {
            this.showToast('Order cancelled successfully.', 'success');
            await this.loadOrdersPage();
        } else {
            this.showToast(response.message || 'Cannot cancel order.', 'error');
        }
    },

    /* --- Order Details & Tracking Modal --- */
    async openOrderModal(orderId) {
        let backdrop = document.getElementById('food-modal-backdrop');
        if (!backdrop) {
            this.createFoodModalElements();
            backdrop = document.getElementById('food-modal-backdrop');
        }

        const modalBody = document.getElementById('food-modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div class="skeleton" style="height: 140px; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 24px; width: 60%; margin: 0 auto;"></div>
            </div>
        `;
        backdrop.classList.add('open');

        const response = await API.getOrderSingle(orderId);

        if (response.success && response.data) {
            const order = response.data;
            const items = order.items || [];
            const payment = order.payment || {};
            const delivery = order.delivery || null;
            const statusConfig = this.getOrderStatusBadge(order.order_status);
            const isDelivered = order.order_status === 'delivered';
            const isCancelled = order.order_status === 'cancelled';
            const formattedDate = new Date(order.created_at).toLocaleString();

            // Progress Bar Tracker Stages
            const stages = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
            const currentStageIdx = stages.indexOf(order.order_status);

            let trackerHtml = '';
            if (!isCancelled) {
                trackerHtml = `
                    <div class="order-tracker">
                        ${stages.map((stg, idx) => {
                            const isDone = idx <= currentStageIdx;
                            const isCurrent = idx === currentStageIdx;
                            const stgBadge = this.getOrderStatusBadge(stg);
                            return `
                                <div class="tracker-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
                                    <div class="tracker-circle">${isDone ? '✓' : (idx + 1)}</div>
                                    <span class="tracker-label">${stgBadge.label}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                trackerHtml = `
                    <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220,38,38,0.3); color: #dc2626; padding: 1rem; border-radius: var(--radius-md); text-align: center; font-weight: 700;">
                        ❌ Order # ${this.escapeHtml(order.order_number)} was Cancelled
                    </div>
                `;
            }

            // Items Mini List
            const itemsListHtml = items.map(item => {
                const fallbackImg = this.getFallbackImage(item.food_name);
                const imageUrl = item.image ? `${API_BASE_URL}/${item.image}` : fallbackImg;
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px dashed var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <img src="${imageUrl}" alt="${this.escapeHtml(item.food_name)}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackImg}';">
                            <div>
                                <strong style="font-size: 0.95rem; display: block;">${this.escapeHtml(item.food_name)}</strong>
                                <span style="font-size: 0.82rem; color: var(--text-muted);">₹${parseFloat(item.unit_price).toFixed(2)} x ${item.quantity}</span>
                            </div>
                        </div>
                        <strong style="font-size: 0.95rem;">₹${parseFloat(item.total_price).toFixed(2)}</strong>
                    </div>
                `;
            }).join('');

            // Review section for Delivered Orders
            let reviewsSectionHtml = '';
            if (isDelivered && items.length > 0) {
                reviewsSectionHtml = `
                    <div style="margin-top: 1.8rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                        <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem;">⭐ Rate Your Food</h3>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            ${items.map(item => `
                                <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                    <div style="font-weight: 700; margin-bottom: 0.5rem;">${this.escapeHtml(item.food_name)}</div>
                                    <div id="review-box-${order.id}-${item.food_id}">
                                        <div style="display: flex; gap: 0.4rem; margin-bottom: 0.6rem;">
                                            ${[1, 2, 3, 4, 5].map(star => `
                                                <button onclick="App.setReviewStar(${order.id}, ${item.food_id}, ${star})" id="star-${order.id}-${item.food_id}-${star}" style="font-size: 1.4rem; cursor: pointer;">☆</button>
                                            `).join('')}
                                        </div>
                                        <textarea id="comment-${order.id}-${item.food_id}" class="form-input" rows="2" placeholder="Write a quick review..."></textarea>
                                        <button onclick="App.submitReview(${order.id}, ${item.food_id})" class="btn btn-primary" style="margin-top: 0.6rem; padding: 0.4rem 0.9rem; font-size: 0.82rem;">Submit Review</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            modalBody.innerHTML = `
                <div class="modal-food-details" style="padding: 1.8rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <span class="order-number" style="font-size: 1.2rem;">${this.escapeHtml(order.order_number)}</span>
                            <div style="font-size: 0.82rem; color: var(--text-muted);">Placed on ${formattedDate}</div>
                        </div>
                        <div class="order-badge ${statusConfig.class}">
                            ${statusConfig.icon} ${statusConfig.label}
                        </div>
                    </div>

                    ${trackerHtml}

                    ${delivery ? `
                        <div style="background: var(--accent-light); padding: 0.8rem 1rem; border-radius: var(--radius-md); margin: 1.2rem 0; font-size: 0.9rem;">
                            🚴 <strong>Assigned Rider:</strong> ${this.escapeHtml(delivery.rider_name)} (${this.escapeHtml(delivery.rider_phone)})
                        </div>
                    ` : ''}

                    <div style="margin: 1.5rem 0;">
                        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.6rem;">📍 Delivery Address</h3>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
                            <strong>${this.escapeHtml(order.recipient_name)}</strong> (${this.escapeHtml(order.phone)})<br>
                            ${this.escapeHtml(order.address)}, ${this.escapeHtml(order.area)}, ${this.escapeHtml(order.city)} - ${this.escapeHtml(order.pincode)}
                        </p>
                    </div>

                    <div style="margin: 1.5rem 0;">
                        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.6rem;">🍕 Ordered Items (${items.length})</h3>
                        ${itemsListHtml}
                    </div>

                    <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.92rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                            <span>Subtotal</span>
                            <span>₹${parseFloat(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; color: var(--accent-secondary);">
                            <span>Discount</span>
                            <span>-₹${parseFloat(order.discount_amount).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                            <span>Delivery Charge</span>
                            <span>₹${parseFloat(order.delivery_charge).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem;">
                            <span>Tax</span>
                            <span>₹${parseFloat(order.tax_amount).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 0.6rem; font-size: 1.1rem; font-weight: 800;">
                            <span>Final Total</span>
                            <span style="color: var(--accent-primary);">₹${parseFloat(order.final_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    ${reviewsSectionHtml}
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">⚠️</div>
                    <div class="state-title">Failed to load order details</div>
                    <div class="state-desc">${this.escapeHtml(response.message || 'Error communicating with PHP backend.')}</div>
                </div>
            `;
        }
    },

    setReviewStar(orderId, foodId, rating) {
        this.state[`review_star_${orderId}_${foodId}`] = rating;
        for (let i = 1; i <= 5; i++) {
            const btn = document.getElementById(`star-${orderId}-${foodId}-${i}`);
            if (btn) {
                btn.textContent = i <= rating ? '⭐' : '☆';
            }
        }
    },

    async submitReview(orderId, foodId) {
        const rating = this.state[`review_star_${orderId}_${foodId}`] || 5;
        const commentEl = document.getElementById(`comment-${orderId}-${foodId}`);
        const comment = commentEl ? commentEl.value : '';

        const response = await API.addReview(orderId, foodId, rating, comment);

        if (response.success) {
            this.showToast('Review submitted successfully!', 'success');
            const box = document.getElementById(`review-box-${orderId}-${foodId}`);
            if (box) {
                box.innerHTML = `<div style="color: var(--accent-secondary); font-weight: 700;">✔ Thank you for your review! (${rating} ⭐)</div>`;
            }
        } else {
            this.showToast(response.message || 'Failed to submit review.', 'error');
        }
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

    /* --- Cart Page Module --- */
    async loadCartPage() {
        const container = document.getElementById('cart-page-container');
        if (!container) return;

        const isInSubfolder = window.location.pathname.includes('/customer/');
        const loginUrl = isInSubfolder ? 'login.html' : 'customer/login.html';
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';

        if (!API.isLoggedIn()) {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">🔒</div>
                    <div class="state-title">Sign In to View Your Cart</div>
                    <div class="state-desc">You need to be logged in to view items in your shopping cart and place orders.</div>
                    <div style="margin-top: 1rem;">
                        <a href="${loginUrl}" class="btn btn-primary">Sign In Now ➔</a>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="state-box" style="margin: 3rem 0;">
                <div class="skeleton" style="height: 180px; width: 100%;"></div>
            </div>
        `;

        const response = await API.getCart();

        if (response.success && response.data) {
            this.state.cartData = response.data;
            this.renderCartUI(response.data, container, menuUrl);
        } else {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">⚠️</div>
                    <div class="state-title">Failed to retrieve shopping cart</div>
                    <div class="state-desc">${this.escapeHtml(response.message || 'Error communicating with PHP backend.')}</div>
                    <button onclick="App.loadCartPage()" class="btn btn-secondary" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
        }
    },

    renderCartUI(cart, container, menuUrl) {
        const items = cart.items || [];
        const subtotal = parseFloat(cart.subtotal || 0);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">🛒</div>
                    <div class="state-title">Your Shopping Cart is Empty</div>
                    <div class="state-desc">Looks like you haven't added any delicious coastal delicacies or pizzas yet.</div>
                    <div style="margin-top: 1.5rem;">
                        <a href="${menuUrl}" class="btn btn-primary">Continue Shopping ➔</a>
                    </div>
                </div>
            `;
            return;
        }

        const totalItemCount = items.reduce((sum, item) => sum + parseInt(item.quantity, 10), 0);

        const itemsHtml = items.map(item => {
            const fallbackImg = this.getFallbackImage(item.name);
            const imageUrl = item.image ? `${API_BASE_URL}/${item.image}` : fallbackImg;
            const unitPrice = parseFloat(item.unit_price).toFixed(2);
            const totalPrice = parseFloat(item.total_price).toFixed(2);
            const isAvailable = Boolean(item.is_available);

            return `
                <div class="cart-item-card">
                    <div class="cart-item-img-wrapper">
                        <img src="${imageUrl}" alt="${this.escapeHtml(item.name)}" class="cart-item-img" onerror="this.onerror=null; this.src='${fallbackImg}';">
                    </div>
                    <div class="cart-item-info">
                        <h3 class="cart-item-name">${this.escapeHtml(item.name)}</h3>
                        <p class="cart-item-price">₹${unitPrice} each</p>
                        ${!isAvailable ? `<span style="color: #dc2626; font-size: 0.8rem; font-weight: 700;">Item Currently Unavailable</span>` : ''}
                    </div>
                    <div class="quantity-controls">
                        <button onclick="App.updateCartQty(${item.item_id}, ${parseInt(item.quantity, 10) - 1})" class="qty-btn">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button onclick="App.updateCartQty(${item.item_id}, ${parseInt(item.quantity, 10) + 1})" class="qty-btn">+</button>
                    </div>
                    <div class="cart-item-total">
                        ₹${totalPrice}
                    </div>
                    <button onclick="App.removeCartItem(${item.item_id})" class="cart-item-remove-btn" title="Remove item">
                        🗑️
                    </button>
                </div>
            `;
        }).join('');

        const isInSubfolder = window.location.pathname.includes('/customer/');
        const checkoutUrl = isInSubfolder ? 'checkout.html' : 'customer/checkout.html';

        container.innerHTML = `
            <div class="cart-layout-grid">
                <div class="cart-items-section">
                    <div class="cart-items-header">
                        <h2>Your Items (${totalItemCount})</h2>
                        <button onclick="App.clearCartConfirmation()" class="btn btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem; color: #dc2626;">Clear Cart</button>
                    </div>
                    <div class="cart-items-list">
                        ${itemsHtml}
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <a href="${menuUrl}" class="btn btn-secondary">← Continue Shopping</a>
                    </div>
                </div>

                <div class="cart-summary-section">
                    <div class="summary-card">
                        <h2 class="summary-title">Order Summary</h2>
                        <div class="summary-row">
                            <span>Items Subtotal (${totalItemCount} items)</span>
                            <span class="summary-val">₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Delivery Charge</span>
                            <span class="summary-val-muted">Calculated at checkout</span>
                        </div>
                        <div class="summary-note">
                            ℹ️ Final delivery charges and applicable coupons will be applied during checkout when selecting your address.
                        </div>
                        <div class="summary-divider"></div>
                        <div class="summary-row summary-total-row">
                            <span>Estimated Subtotal</span>
                            <span class="summary-total-price">₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="margin-top: 1.5rem;">
                            <a href="${checkoutUrl}" class="btn btn-primary" style="width: 100%; text-align: center; justify-content: center;">
                                Proceed to Checkout ➔
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async updateCartQty(itemId, newQty) {
        if (newQty <= 0) {
            await this.removeCartItem(itemId);
            return;
        }

        const response = await API.updateCartItem(itemId, newQty);
        if (response.success) {
            this.showToast('Cart updated.', 'success');
            await this.updateCartCount();
            await this.loadCartPage();
        } else {
            this.showToast(response.message || 'Failed to update item quantity.', 'error');
        }
    },

    async removeCartItem(itemId) {
        const response = await API.removeCartItem(itemId);
        if (response.success) {
            this.showToast('Item removed from cart.', 'success');
            await this.updateCartCount();
            await this.loadCartPage();
        } else {
            this.showToast(response.message || 'Failed to remove item.', 'error');
        }
    },

    async clearCartConfirmation() {
        if (confirm('Are you sure you want to clear your entire cart?')) {
            const response = await API.clearCart();
            if (response.success) {
                this.showToast('Cart cleared.', 'success');
                await this.updateCartCount();
                await this.loadCartPage();
            } else {
                this.showToast(response.message || 'Failed to clear cart.', 'error');
            }
        }
    },

    /* --- Checkout Module (Step 5) --- */
    async loadCheckoutPage() {
        const container = document.getElementById('checkout-page-container');
        if (!container) return;

        const isInSubfolder = window.location.pathname.includes('/customer/');
        const loginUrl = isInSubfolder ? 'login.html' : 'customer/login.html';
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';

        if (!API.isLoggedIn()) {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">🔒</div>
                    <div class="state-title">Sign In Required for Checkout</div>
                    <div class="state-desc">Please log in to select your delivery address and complete your order.</div>
                    <div style="margin-top: 1rem;">
                        <a href="${loginUrl}" class="btn btn-primary">Sign In Now ➔</a>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="state-box" style="margin: 3rem 0;">
                <div class="skeleton" style="height: 240px; width: 100%;"></div>
            </div>
        `;

        const [cartRes, addrRes, delRes] = await Promise.all([
            API.getCart(),
            API.getAddresses(),
            API.calculateDeliveryCharge(2.5)
        ]);

        if (!cartRes.success || !cartRes.data || !Array.isArray(cartRes.data.items) || cartRes.data.items.length === 0) {
            container.innerHTML = `
                <div class="state-box" style="margin: 3rem 0;">
                    <div class="state-icon">🛒</div>
                    <div class="state-title">Your Cart is Empty</div>
                    <div class="state-desc">Add some delicious dishes to your cart before proceeding to checkout.</div>
                    <div style="margin-top: 1.5rem;">
                        <a href="${menuUrl}" class="btn btn-primary">Browse Menu ➔</a>
                    </div>
                </div>
            `;
            return;
        }

        this.state.cartData = cartRes.data;
        this.state.addresses = addrRes.success && Array.isArray(addrRes.data) ? addrRes.data : [];
        this.state.deliveryCharge = delRes.success && delRes.data && delRes.data.delivery_charge ? parseFloat(delRes.data.delivery_charge) : 3.50;

        if (this.state.addresses.length > 0) {
            const defAddr = this.state.addresses.find(a => Boolean(a.is_default)) || this.state.addresses[0];
            this.state.selectedAddressId = defAddr.id;
        } else {
            this.state.selectedAddressId = null;
        }

        this.renderCheckoutUI(container, menuUrl);
    },

    renderCheckoutUI(container, menuUrl) {
        const cart = this.state.cartData;
        const items = cart.items || [];
        const subtotal = parseFloat(cart.subtotal || 0);
        const addresses = this.state.addresses;
        const selectedId = this.state.selectedAddressId;

        let addressListHtml = '';
        if (addresses.length === 0) {
            addressListHtml = `<div class="summary-note" style="background: rgba(234, 179, 8, 0.1); border-color: #eab308; color: var(--text-primary);">⚠️ No saved addresses found. Please add a new delivery address below.</div>`;
        } else {
            addressListHtml = `<div class="address-grid">` + addresses.map(addr => `
                <div class="address-card ${selectedId === addr.id ? 'active' : ''}" onclick="App.selectCheckoutAddress(${addr.id})">
                    <div class="address-card-header">
                        <span class="address-radio">${selectedId === addr.id ? '🔘' : '⚪'}</span>
                        <strong class="address-name">${this.escapeHtml(addr.name)}</strong>
                        ${Boolean(addr.is_default) ? `<span class="address-tag-default">Default</span>` : ''}
                    </div>
                    <p class="address-phone">📞 ${this.escapeHtml(addr.phone)}</p>
                    <p class="address-text">${this.escapeHtml(addr.address)}, ${this.escapeHtml(addr.area)}, ${this.escapeHtml(addr.city)} - ${this.escapeHtml(addr.pincode)}</p>
                    ${addr.landmark ? `<p class="address-landmark">📍 ${this.escapeHtml(addr.landmark)}</p>` : ''}
                </div>
            `).join('') + `</div>`;
        }

        const itemsMiniHtml = items.map(item => `
            <div class="checkout-item-row">
                <div>
                    <strong>${this.escapeHtml(item.name)}</strong>
                    <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">x${item.quantity}</span>
                </div>
                <div style="font-weight: 700;">₹${parseFloat(item.total_price).toFixed(2)}</div>
            </div>
        `).join('');

        container.innerHTML = `
            <div id="checkout-form-view" class="checkout-layout-grid">
                <div style="display: flex; flex-direction: column; gap: 1.8rem;">
                    <div class="checkout-section-card">
                        <div class="checkout-step-title">
                            <span>1</span>
                            <h2>Select Delivery Address</h2>
                        </div>
                        
                        ${addressListHtml}

                        <div style="margin-top: 1.2rem;">
                            <button onclick="App.toggleAddAddressForm()" class="btn btn-secondary" style="font-size: 0.88rem; width: 100%; justify-content: center;">
                                ➕ Add New Delivery Address
                            </button>
                        </div>

                        <div id="add-address-form-box" style="display: none; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed var(--border-color);">
                            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;">New Address Details</h3>
                            <form id="new-address-form" onsubmit="App.handleSaveAddress(event)" class="auth-form" style="gap: 1rem;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label">Recipient Name *</label>
                                        <input type="text" id="addr-name" class="form-input" required placeholder="John Doe">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Phone Number *</label>
                                        <input type="tel" id="addr-phone" class="form-input" required placeholder="9876543210">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Street Address *</label>
                                    <input type="text" id="addr-address" class="form-input" required placeholder="Flat / House No / Street">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem;">
                                    <div class="form-group">
                                        <label class="form-label">Area *</label>
                                        <input type="text" id="addr-area" class="form-input" required placeholder="Downtown">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">City *</label>
                                        <input type="text" id="addr-city" class="form-input" required placeholder="New York">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Pincode *</label>
                                        <input type="text" id="addr-pincode" class="form-input" required placeholder="10001">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Landmark (Optional)</label>
                                    <input type="text" id="addr-landmark" class="form-input" placeholder="Near Central Park">
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" id="addr-default" value="1">
                                    <label for="addr-default" style="font-size: 0.9rem; cursor: pointer;">Set as default delivery address</label>
                                </div>
                                <div style="display: flex; gap: 0.8rem; margin-top: 0.5rem;">
                                    <button type="submit" id="save-addr-btn" class="btn btn-primary" style="flex: 1;">Save & Select Address</button>
                                    <button type="button" onclick="App.toggleAddAddressForm()" class="btn btn-secondary">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="checkout-section-card">
                        <div class="checkout-step-title">
                            <span>2</span>
                            <h2>Order Items Summary (${items.length})</h2>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                            ${itemsMiniHtml}
                        </div>
                    </div>

                    <div class="checkout-section-card">
                        <div class="checkout-step-title">
                            <span>3</span>
                            <h2>Apply Coupon</h2>
                        </div>
                        <div id="coupon-form-box" style="display: flex; gap: 0.8rem;">
                            <input type="text" id="checkout-coupon-code" class="form-input" placeholder="Enter coupon code (e.g. WELCOME10)" style="text-transform: uppercase;">
                            <button onclick="App.handleApplyCoupon()" id="apply-coupon-btn" class="btn btn-secondary" style="white-space: nowrap;">Apply</button>
                        </div>
                        <div id="coupon-status-box" style="margin-top: 0.6rem;">
                            ${this.state.appliedCoupon ? `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(46, 125, 50, 0.1); border: 1px solid rgba(46, 125, 50, 0.3); padding: 0.6rem 1rem; border-radius: var(--radius-sm); color: var(--accent-secondary); font-size: 0.9rem;">
                                    <span>🎉 Coupon <strong>${this.escapeHtml(this.state.appliedCoupon.code)}</strong> applied (-₹${this.state.appliedCoupon.discount_amount.toFixed(2)})</span>
                                    <button onclick="App.removeCoupon()" style="color: #dc2626; font-weight: 700; cursor: pointer;">Remove</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="checkout-section-card">
                        <div class="checkout-step-title">
                            <span>4</span>
                            <h2>Special Instructions</h2>
                        </div>
                        <textarea id="checkout-instructions" class="form-input" rows="2" placeholder="e.g. Please make it less spicy, ring the doorbell twice."></textarea>
                    </div>

                    <div class="checkout-section-card">
                        <div class="checkout-step-title">
                            <span>5</span>
                            <h2>Payment Method</h2>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                            <label class="payment-option-card ${this.state.selectedPaymentMethod === 'COD' ? 'active' : ''}">
                                <input type="radio" name="payment_method" value="COD" ${this.state.selectedPaymentMethod === 'COD' ? 'checked' : ''} onchange="App.selectPaymentMethod('COD')">
                                <div style="margin-left: 0.6rem;">
                                    <strong style="display: block;">💵 Cash on Delivery (COD)</strong>
                                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Pay with cash or UPI when your food arrives.</span>
                                </div>
                            </label>

                            <label class="payment-option-card ${this.state.selectedPaymentMethod === 'ONLINE' ? 'active' : ''}">
                                <input type="radio" name="payment_method" value="ONLINE" ${this.state.selectedPaymentMethod === 'ONLINE' ? 'checked' : ''} onchange="App.selectPaymentMethod('ONLINE')">
                                <div style="margin-left: 0.6rem;">
                                    <strong style="display: block;">💳 Online Payment</strong>
                                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Direct online payment verification upon delivery.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="cart-summary-section">
                    <div class="summary-card">
                        <h2 class="summary-title">Payment Breakdown</h2>
                        
                        <div class="summary-row">
                            <span>Items Subtotal</span>
                            <span class="summary-val">₹${subtotal.toFixed(2)}</span>
                        </div>

                        <div class="summary-row" style="color: var(--accent-secondary);">
                            <span>Coupon Discount</span>
                            <span class="summary-val" style="color: var(--accent-secondary);">-₹${(this.state.appliedCoupon ? this.state.appliedCoupon.discount_amount : 0.00).toFixed(2)}</span>
                        </div>

                        <div class="summary-row">
                            <span>Delivery Charge</span>
                            <span class="summary-val">₹${this.state.deliveryCharge.toFixed(2)}</span>
                        </div>

                        <div class="summary-row">
                            <span>Estimated Tax (5%)</span>
                            <span class="summary-val">₹${this.calculateTax(subtotal, this.state.appliedCoupon ? this.state.appliedCoupon.discount_amount : 0.00).toFixed(2)}</span>
                        </div>

                        <div class="summary-divider"></div>

                        <div class="summary-row summary-total-row">
                            <span>Grand Total</span>
                            <span class="summary-total-price">₹${this.calculateGrandTotal(subtotal, this.state.deliveryCharge, this.state.appliedCoupon ? this.state.appliedCoupon.discount_amount : 0.00).toFixed(2)}</span>
                        </div>

                        <div id="place-order-alert" class="auth-alert" style="margin-top: 1rem;"></div>

                        <div style="margin-top: 1.5rem;">
                            <button onclick="App.placeCustomerOrder()" id="place-order-btn" class="btn btn-primary" style="width: 100%; justify-content: center;" ${!selectedId ? 'disabled' : ''}>
                                ${!selectedId ? 'Select Delivery Address First' : 'Place Order ➔'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="order-success-screen" style="display: none; margin: 3rem 0;"></div>
        `;
    },

    selectCheckoutAddress(addressId) {
        this.state.selectedAddressId = addressId;
        const container = document.getElementById('checkout-page-container');
        const isInSubfolder = window.location.pathname.includes('/customer/');
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
        this.renderCheckoutUI(container, menuUrl);
    },

    selectPaymentMethod(method) {
        this.state.selectedPaymentMethod = method;
        const container = document.getElementById('checkout-page-container');
        const isInSubfolder = window.location.pathname.includes('/customer/');
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
        this.renderCheckoutUI(container, menuUrl);
    },

    toggleAddAddressForm() {
        const box = document.getElementById('add-address-form-box');
        if (box) {
            box.style.display = box.style.display === 'none' ? 'block' : 'none';
        }
    },

    async handleSaveAddress(e) {
        e.preventDefault();
        const btn = document.getElementById('save-addr-btn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const addressData = {
            name: document.getElementById('addr-name').value.trim(),
            phone: document.getElementById('addr-phone').value.trim(),
            address: document.getElementById('addr-address').value.trim(),
            area: document.getElementById('addr-area').value.trim(),
            city: document.getElementById('addr-city').value.trim(),
            pincode: document.getElementById('addr-pincode').value.trim(),
            landmark: document.getElementById('addr-landmark').value.trim(),
            is_default: document.getElementById('addr-default').checked ? 1 : 0
        };

        const response = await API.addAddress(addressData);

        if (response.success && response.data && response.data.id) {
            this.showToast('New address added successfully!', 'success');
            const addrRes = await API.getAddresses();
            if (addrRes.success && Array.isArray(addrRes.data)) {
                this.state.addresses = addrRes.data;
                this.state.selectedAddressId = response.data.id;
            }
            const container = document.getElementById('checkout-page-container');
            const isInSubfolder = window.location.pathname.includes('/customer/');
            const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
            this.renderCheckoutUI(container, menuUrl);
        } else {
            this.showToast(response.message || 'Failed to add address.', 'error');
            btn.disabled = false;
            btn.textContent = 'Save & Select Address';
        }
    },

    async handleApplyCoupon() {
        const codeInput = document.getElementById('checkout-coupon-code');
        const code = codeInput ? codeInput.value.trim() : '';

        if (!code) {
            this.showToast('Please enter a coupon code.', 'error');
            return;
        }

        const subtotal = parseFloat(this.state.cartData.subtotal || 0);
        const btn = document.getElementById('apply-coupon-btn');
        btn.disabled = true;
        btn.textContent = 'Validating...';

        const response = await API.validateCoupon(code, subtotal);

        if (response.success && response.data) {
            this.state.appliedCoupon = response.data;
            this.showToast(`Coupon '${code.toUpperCase()}' applied successfully!`, 'success');
            const container = document.getElementById('checkout-page-container');
            const isInSubfolder = window.location.pathname.includes('/customer/');
            const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
            this.renderCheckoutUI(container, menuUrl);
        } else {
            this.showToast(response.message || 'Invalid coupon code.', 'error');
            btn.disabled = false;
            btn.textContent = 'Apply';
        }
    },

    removeCoupon() {
        this.state.appliedCoupon = null;
        this.showToast('Coupon removed.', 'info');
        const container = document.getElementById('checkout-page-container');
        const isInSubfolder = window.location.pathname.includes('/customer/');
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
        this.renderCheckoutUI(container, menuUrl);
    },

    async placeCustomerOrder() {
        if (!this.state.selectedAddressId) {
            this.showToast('Please select a delivery address before placing your order.', 'error');
            return;
        }

        if (this.state.isSubmittingOrder) return;
        this.state.isSubmittingOrder = true;

        const btn = document.getElementById('place-order-btn');
        const alertBox = document.getElementById('place-order-alert');
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner">⏳</span> Placing Order...`;
        }

        const payload = {
            address_id: parseInt(this.state.selectedAddressId, 10),
            coupon_code: this.state.appliedCoupon ? this.state.appliedCoupon.code : null,
            distance_km: 2.5,
            payment_method: this.state.selectedPaymentMethod,
            special_instructions: (document.getElementById('checkout-instructions') ? document.getElementById('checkout-instructions').value.trim() : '')
        };

        const response = await API.createOrder(payload);

        if (response.success && response.data) {
            this.showToast('🎉 Order placed successfully!', 'success');
            await this.updateCartCount();
            this.renderOrderSuccessScreen(response.data);
        } else {
            const errorMsg = response.message || 'Failed to place order.';
            this.showToast(errorMsg, 'error');
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.className = 'auth-alert auth-alert-error';
                alertBox.textContent = errorMsg;
            }
            this.state.isSubmittingOrder = false;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Place Order ➔';
            }
        }
    },

    renderOrderSuccessScreen(orderData) {
        const formView = document.getElementById('checkout-form-view');
        const successView = document.getElementById('order-success-screen');

        if (formView) formView.style.display = 'none';
        if (!successView) return;

        const totals = orderData.totals || {};
        const isInSubfolder = window.location.pathname.includes('/customer/');
        const menuUrl = isInSubfolder ? 'menu.html' : 'customer/menu.html';
        const ordersUrl = isInSubfolder ? 'orders.html' : 'customer/orders.html';

        successView.style.display = 'block';
        successView.innerHTML = `
            <div class="state-box" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 3rem 2rem;">
                <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🎉</div>
                <h1 style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Order Placed Successfully!</h1>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Thank you for ordering with Kudla Kitchen. Your order has been confirmed and sent to our kitchen display.</p>

                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.5rem; text-align: left; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Order Number</span>
                        <strong style="font-size: 1.1rem; color: var(--accent-primary);">${this.escapeHtml(orderData.order_number)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem;">
                        <span>Payment Method</span>
                        <strong>${this.escapeHtml(orderData.payment_method)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem;">
                        <span>Transaction ID</span>
                        <code style="font-size: 0.85rem;">${this.escapeHtml(orderData.transaction_id)}</code>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 0.8rem; font-size: 1.1rem; font-weight: 800;">
                        <span>Total Paid / Due</span>
                        <span style="color: var(--text-primary);">₹${parseFloat(totals.final_amount || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="${ordersUrl}" class="btn btn-primary">Track / View Orders ➔</a>
                    <a href="${menuUrl}" class="btn btn-secondary">Continue Shopping</a>
                </div>
            </div>
        `;
    },

    calculateTax(subtotal, discount) {
        const subtotalAfterDiscount = Math.max(0, subtotal - discount);
        return Math.round((subtotalAfterDiscount * 5.0) / 100 * 100) / 100;
    },

    calculateGrandTotal(subtotal, deliveryCharge, discount) {
        const subtotalAfterDiscount = Math.max(0, subtotal - discount);
        const tax = this.calculateTax(subtotal, discount);
        return Math.round((subtotalAfterDiscount + deliveryCharge + tax) * 100) / 100;
    },

    /* --- Load Categories Dynamic --- */
    async loadCategories() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        container.innerHTML = this.renderCategorySkeletons(4);

        const response = await API.getCategories();

        if (response.success && Array.isArray(response.data)) {
            this.state.categories = response.data;
            this.renderCategories(response.data);
            this.renderCategoryTabs(response.data);
        } else {
            container.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">⚠️</div>
                    <div class="state-title">Failed to load categories</div>
                    <div class="state-desc">${this.escapeHtml(response.message || 'Please check backend database connection.')}</div>
                </div>
            `;
        }
    },

    renderCategories(categories) {
        const container = document.getElementById('categories-container');
        if (!container) return;

        if (categories.length === 0) {
            container.innerHTML = `<div class="state-box"><div class="state-desc">No categories available right now.</div></div>`;
            return;
        }

        const iconsMap = {
            'pizzas': '🍕',
            'burgers': '🍔',
            'pasta': '🍝',
            'beverages': '🥤',
            'desserts': '🍰',
            'coastal': '🍤',
            'south indian': '🍛',
            'north indian': '🍲',
            'biryani': '🍚',
            'chicken': '🍗',
            'seafood': '🐟'
        };

        const cardsHtml = categories.map(cat => {
            const nameLower = cat.name.toLowerCase();
            let icon = '🍽️';
            for (const [key, ic] of Object.entries(iconsMap)) {
                if (nameLower.includes(key)) {
                    icon = ic;
                    break;
                }
            }

            return `
                <div class="category-card ${this.state.selectedCategoryId === cat.id ? 'active' : ''}" 
                     onclick="App.selectCategory(${cat.id})">
                    <div class="category-icon">${icon}</div>
                    <h3 class="category-title">${this.escapeHtml(cat.name)}</h3>
                    <p class="category-count">${this.escapeHtml(cat.description || 'Authentic recipes')}</p>
                </div>
            `;
        }).join('');

        container.innerHTML = cardsHtml;
    },

    renderCategoryTabs(categories) {
        const tabsContainer = document.getElementById('category-tabs');
        if (!tabsContainer) return;

        let tabsHtml = `
            <button class="tab-btn ${this.state.selectedCategoryId === 0 ? 'active' : ''}" 
                    onclick="App.selectCategory(0)">All Dishes</button>
        `;

        tabsHtml += categories.map(cat => `
            <button class="tab-btn ${this.state.selectedCategoryId === cat.id ? 'active' : ''}" 
                    onclick="App.selectCategory(${cat.id})">${this.escapeHtml(cat.name)}</button>
        `).join('');

        tabsContainer.innerHTML = tabsHtml;
    },

    selectCategory(categoryId) {
        this.state.selectedCategoryId = categoryId;
        this.renderCategories(this.state.categories);
        this.renderCategoryTabs(this.state.categories);
        this.loadFoodItems();
    },

    /* --- Load Food Items Dynamic --- */
    async loadFoodItems() {
        const container = document.getElementById('food-container');
        if (!container) return;

        container.innerHTML = this.renderFoodSkeletons(6);

        const response = await API.getFood(this.state.selectedCategoryId, this.state.searchQuery);

        if (response.success && Array.isArray(response.data)) {
            this.state.foodItems = response.data;
            this.renderFoodItems(response.data);
        } else {
            container.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">❌</div>
                    <div class="state-title">Unable to fetch food items</div>
                    <div class="state-desc">${this.escapeHtml(response.message || 'Error communicating with PHP backend.')}</div>
                </div>
            `;
        }
    },

    renderFoodItems(items) {
        const container = document.getElementById('food-container');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">🔍</div>
                    <div class="state-title">No dishes found</div>
                    <div class="state-desc">Try selecting a different category or adjusting your search term.</div>
                </div>
            `;
            return;
        }

        const cardsHtml = items.map(food => {
            const fallbackImg = this.getFallbackImage(food.name, food.category_name);
            const imageUrl = food.image ? `${API_BASE_URL}/${food.image}` : fallbackImg;
            const isAvailable = Boolean(food.is_available);

            return `
                <div class="food-card">
                    <div class="food-img-wrapper" onclick="App.openFoodModal(${food.id})" style="cursor: pointer;">
                        <img src="${imageUrl}" 
                             alt="${this.escapeHtml(food.name)}" 
                             class="food-img" 
                             onerror="this.onerror=null; this.src='${fallbackImg}';">
                        <span class="food-badge ${isAvailable ? 'badge-prep' : 'badge-unavailable'}">
                            ${isAvailable ? `⏱️ ${food.preparation_time || 20} mins` : 'Out of Stock'}
                        </span>
                    </div>
                    <div class="food-content">
                        <span class="food-category-tag">${this.escapeHtml(food.category_name || 'Specialty')}</span>
                        <div class="food-header">
                            <h3 class="food-title" onclick="App.openFoodModal(${food.id})" style="cursor: pointer;">${this.escapeHtml(food.name)}</h3>
                        </div>
                        <p class="food-desc">${this.escapeHtml(food.description || 'Delicious freshly prepared dish.')}</p>
                        <div class="food-footer">
                            <span class="food-price">₹${parseFloat(food.price).toFixed(2)}</span>
                            <div style="display: flex; gap: 0.4rem;">
                                <button onclick="App.openFoodModal(${food.id})" class="btn btn-secondary" style="padding: 0.45rem 0.75rem; font-size: 0.82rem;" title="View Details">🔍</button>
                                <button onclick="App.handleAddToCart(${food.id}, this)" 
                                        class="add-cart-btn" 
                                        ${!isAvailable ? 'disabled' : ''}>
                                    ${isAvailable ? '➕ Add' : 'Unavailable'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cardsHtml;
    },

    /* --- Add to Cart Handler --- */
    async handleAddToCart(foodId, btnElement, quantity = 1) {
        if (!API.isLoggedIn()) {
            this.showToast('Please login to add items to your cart.', 'error');
            const isInSubfolder = window.location.pathname.includes('/customer/');
            const loginUrl = isInSubfolder ? 'login.html' : 'customer/login.html';
            setTimeout(() => {
                window.location.href = loginUrl;
            }, 1200);
            return;
        }

        const originalText = btnElement ? btnElement.innerHTML : '';
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = 'Adding...';
        }

        const response = await API.addToCart(foodId, quantity);

        if (response.success) {
            this.showToast(response.message || 'Item added to cart!', 'success');
            this.updateCartCount();
            if (btnElement) {
                btnElement.innerHTML = '✔ Added';
                setTimeout(() => {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalText;
                }, 1800);
            }
        } else {
            this.showToast(response.message || 'Failed to add item to cart.', 'error');
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText;
            }
        }
    },

    /* --- Food Details Modal --- */
    async openFoodModal(foodId) {
        this.state.activeModalFoodId = foodId;
        this.state.modalQuantity = 1;

        let backdrop = document.getElementById('food-modal-backdrop');
        if (!backdrop) {
            this.createFoodModalElements();
            backdrop = document.getElementById('food-modal-backdrop');
        }

        const modalBody = document.getElementById('food-modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div class="skeleton" style="height: 180px; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 24px; width: 60%; margin: 0 auto 0.8rem auto;"></div>
                <div class="skeleton" style="height: 16px; width: 80%; margin: 0 auto;"></div>
            </div>
        `;
        backdrop.classList.add('open');

        const response = await API.getFoodSingle(foodId);

        if (response.success && response.data) {
            const food = response.data;
            const fallbackImg = this.getFallbackImage(food.name, food.category_name);
            const imageUrl = food.image ? `${API_BASE_URL}/${food.image}` : fallbackImg;
            const isAvailable = Boolean(food.is_available);

            modalBody.innerHTML = `
                <div class="modal-food-img-wrapper">
                    <img src="${imageUrl}" alt="${this.escapeHtml(food.name)}" class="modal-food-img" onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <span class="food-badge ${isAvailable ? 'badge-prep' : 'badge-unavailable'}" style="top: 14px; right: 14px;">
                        ${isAvailable ? `⏱️ ${food.preparation_time || 20} mins` : 'Out of Stock'}
                    </span>
                </div>
                <div class="modal-food-details">
                    <span class="food-category-tag">${this.escapeHtml(food.category_name || 'Specialty')}</span>
                    <h2 class="modal-food-title">${this.escapeHtml(food.name)}</h2>
                    <p class="modal-food-desc">${this.escapeHtml(food.description || 'Prepared fresh with high quality ingredients and authentic spices.')}</p>
                    
                    <div class="modal-food-row">
                        <div class="modal-price">₹${parseFloat(food.price).toFixed(2)}</div>
                        ${isAvailable ? `
                            <div class="quantity-controls">
                                <button onclick="App.changeModalQty(-1)" class="qty-btn">-</button>
                                <span id="modal-qty-val" class="qty-val">1</span>
                                <button onclick="App.changeModalQty(1)" class="qty-btn">+</button>
                            </div>
                        ` : ''}
                    </div>

                    <div style="margin-top: 1.5rem;">
                        <button onclick="App.handleAddToCartFromModal(${food.id}, this)" 
                                class="btn btn-primary" 
                                style="width: 100%;" 
                                ${!isAvailable ? 'disabled' : ''}>
                            ${isAvailable ? '🛒 Add to Cart' : 'Currently Unavailable'}
                        </button>
                    </div>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">⚠️</div>
                    <div class="state-title">Failed to load dish details</div>
                    <div class="state-desc">${this.escapeHtml(response.message || 'Could not fetch food information.')}</div>
                </div>
            `;
        }
    },

    changeModalQty(delta) {
        this.state.modalQuantity = Math.max(1, this.state.modalQuantity + delta);
        const qtyVal = document.getElementById('modal-qty-val');
        if (qtyVal) qtyVal.textContent = this.state.modalQuantity;
    },

    async handleAddToCartFromModal(foodId, btnElement) {
        await this.handleAddToCart(foodId, btnElement, this.state.modalQuantity);
        if (API.isLoggedIn()) {
            this.closeFoodModal();
        }
    },

    closeFoodModal() {
        const backdrop = document.getElementById('food-modal-backdrop');
        if (backdrop) backdrop.classList.remove('open');
    },

    createFoodModalElements() {
        const backdrop = document.createElement('div');
        backdrop.id = 'food-modal-backdrop';
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML = `
            <div class="modal-dialog">
                <button onclick="App.closeFoodModal()" class="modal-close-btn" aria-label="Close modal">✖</button>
                <div id="food-modal-body"></div>
            </div>
        `;
        document.body.appendChild(backdrop);
    },

    /* --- Helpers & Fallbacks --- */
    getFallbackImage(foodName = '', categoryName = '') {
        const lower = (foodName + ' ' + categoryName).toLowerCase();
        if (lower.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80';
        if (lower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80';
        if (lower.includes('pasta')) return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80';
        if (lower.includes('shake') || lower.includes('smoothie') || lower.includes('beverage')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80';
        if (lower.includes('cake') || lower.includes('dessert') || lower.includes('bake')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80';
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80';
    },

    renderCategorySkeletons(count) {
        return Array(count).fill(0).map(() => `
            <div class="category-card skeleton" style="height: 120px;"></div>
        `).join('');
    },

    renderFoodSkeletons(count) {
        return Array(count).fill(0).map(() => `
            <div class="food-card skeleton" style="height: 340px;"></div>
        `).join('');
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
