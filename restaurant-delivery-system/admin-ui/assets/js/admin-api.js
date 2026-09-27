/**
 * Kudla Kitchen - Admin API Client Helper
 * Handles requests to PHP REST API backend & Admin endpoints
 */

const getAdminApiBaseUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // Find restaurant-delivery-system folder in URL path
    const folderName = 'restaurant-delivery-system';
    const folderIndex = pathname.indexOf(folderName);
    
    if (folderIndex !== -1) {
        const basePath = pathname.substring(0, folderIndex + folderName.length);
        return `${origin}${basePath}`;
    }
    
    return origin;
};

const ADMIN_API_BASE_URL = getAdminApiBaseUrl();

const AdminAPI = {
    getToken() {
        return localStorage.getItem('kk_admin_token');
    },
    
    setToken(token) {
        localStorage.setItem('kk_admin_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('kk_admin_token');
        localStorage.removeItem('kk_admin_user');
    },
    
    getUser() {
        const user = localStorage.getItem('kk_admin_user');
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem('kk_admin_user', JSON.stringify(user));
    },
    
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!token && user && user.role === 'admin';
    },

    async request(endpoint, method = 'GET', data = null) {
        const url = `${ADMIN_API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers,
            credentials: 'include'
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            let json = {};
            
            try {
                json = await response.json();
            } catch (parseError) {
                return {
                    success: false,
                    message: `Server returned non-JSON response (Status: ${response.status})`,
                    errors: [parseError.message]
                };
            }

            if (!response.ok || json.success === false) {
                // If 401/403, remove invalid token
                if (response.status === 401 || response.status === 403) {
                    this.removeToken();
                }
                return {
                    success: false,
                    message: json.message || `Request failed with status ${response.status}`,
                    errors: json.errors || [],
                    statusCode: response.status
                };
            }

            return json;
        } catch (err) {
            console.error('Admin API Fetch Exception:', err);
            return {
                success: false,
                message: 'Unable to connect to the Kudla Kitchen server. Please check XAMPP or your connection.',
                errors: [err.message]
            };
        }
    },

    // Admin Auth API Callers
    async login(email, password) {
        const response = await this.request('/api/auth/login.php', 'POST', { email, password });
        if (response.success && response.data && response.data.token) {
            const user = response.data.user;
            if (user && user.role === 'admin') {
                this.setToken(response.data.token);
                this.setUser(user);
            } else {
                return {
                    success: false,
                    message: "Access Denied. You must have Administrator privileges to access the Admin Panel.",
                    errors: ["Role unauthorized"]
                };
            }
        }
        return response;
    },

    async getProfile() {
        const response = await this.request('/api/auth/profile.php', 'GET');
        if (response.success && response.data) {
            if (response.data.role === 'admin') {
                this.setUser(response.data);
            } else {
                this.removeToken();
            }
        }
        return response;
    },

    async logout() {
        try {
            await this.request('/api/auth/logout.php', 'POST');
        } catch (e) {
            console.warn('Logout API error:', e);
        } finally {
            this.removeToken();
        }
        return { success: true, message: "Logged out successfully." };
    },

    // Admin Dashboard Callers
    async getDashboard() {
        return this.request('/admin/dashboard.php', 'GET');
    },

    async getRecentOrders() {
        return this.request('/admin/orders.php', 'GET');
    },

    async getReports() {
        return this.request('/admin/reports.php', 'GET');
    },

    // Admin Orders API Callers
    async getOrders() {
        // api/orders/get.php returns customer_name and customer_email for Admin
        return this.request('/admin/orders.php', 'GET');
    },

    async getOrderDetails(orderId) {
        return this.request(`/api/orders/get_single.php?id=${orderId}`, 'GET');
    },

    async updateOrderStatus(orderId, orderStatus) {
        return this.request('/api/orders/update_status.php', 'POST', {
            order_id: parseInt(orderId, 10),
            order_status: orderStatus
        });
    },

    async cancelOrder(orderId) {
        // Admin status update to cancelled handles validation via isValidStatusTransition
        return this.updateOrderStatus(orderId, 'cancelled');
    },

    async getDeliveryLogistics() {
        return this.request('/admin/delivery.php', 'GET');
    },

    async assignDeliveryPartner(orderId, partnerId) {
        return this.request('/api/delivery/assign.php', 'POST', {
            order_id: parseInt(orderId, 10),
            delivery_partner_id: parseInt(partnerId, 10)
        });
    },

    // Food Management API Callers
    async getFoodCatalog() {
        return this.request('/admin/food.php', 'GET');
    },

    async addFood(foodData) {
        return this.request('/api/food/add.php', 'POST', foodData);
    },

    async updateFood(foodData) {
        return this.request('/api/food/update.php', 'POST', foodData);
    },

    async deleteFood(id) {
        return this.request('/api/food/delete.php', 'POST', { id: parseInt(id, 10) });
    },

    // Category Management API Callers
    async getCategories() {
        return this.request('/admin/categories.php', 'GET');
    },

    async addCategory(categoryData) {
        return this.request('/api/categories/add.php', 'POST', categoryData);
    },

    async updateCategory(categoryData) {
        return this.request('/api/categories/update.php', 'POST', categoryData);
    },

    async deleteCategory(id) {
        return this.request('/api/categories/delete.php', 'POST', { id: parseInt(id, 10) });
    },

    // Users / Customer Management API Callers
    async getUsers() {
        return this.request('/admin/users.php', 'GET');
    },

    async updateUser(userData) {
        return this.request('/api/users/update.php', 'POST', userData);
    },

    async deleteUser(id) {
        return this.request('/api/users/delete.php', 'POST', { id: parseInt(id, 10) });
    },

    // Delivery Partners & Zones API Callers
    async getDeliveryZones() {
        return this.request('/api/delivery/zones.php', 'GET');
    },

    // Coupon Management API Callers
    async getCoupons() {
        return this.request('/admin/coupons.php', 'GET');
    },

    async addCoupon(couponData) {
        return this.request('/api/coupons/add.php', 'POST', couponData);
    },

    async deleteCoupon(id) {
        return this.request('/api/coupons/delete.php', 'POST', { id: parseInt(id, 10) });
    },

    // Reports & Analytics API Callers
    async getAnalyticsDashboard() {
        return this.request('/api/analytics/dashboard.php', 'GET');
    },

    async getAnalyticsOrders() {
        return this.request('/api/analytics/orders.php', 'GET');
    },

    async getAnalyticsPopularFood() {
        return this.request('/api/analytics/popular_food.php', 'GET');
    },

    async getAnalyticsSales() {
        return this.request('/api/analytics/sales.php', 'GET');
    }
};
