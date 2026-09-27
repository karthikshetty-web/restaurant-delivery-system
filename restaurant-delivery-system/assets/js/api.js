/**
 * Kudla Kitchen - API Client Helper
 * Handles requests to PHP REST API backend
 */

// Dynamically determine the API base URL based on current deployment environment
const getApiBaseUrl = () => {
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

const API_BASE_URL = getApiBaseUrl();

const API = {
    // Storage helpers
    getToken() {
        return localStorage.getItem('kk_token');
    },
    
    setToken(token) {
        localStorage.setItem('kk_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('kk_token');
        localStorage.removeItem('kk_user');
    },
    
    getUser() {
        const user = localStorage.getItem('kk_user');
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem('kk_user', JSON.stringify(user));
    },
    
    isLoggedIn() {
        return !!this.getToken();
    },

    // Core HTTP Request Handler
    async request(endpoint, method = 'GET', data = null) {
        const url = `${API_BASE_URL}${endpoint}`;
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
                // If 401 Unauthorized, remove invalid token
                if (response.status === 401) {
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
            console.error('API Fetch Exception:', err);
            return {
                success: false,
                message: 'Unable to connect to the Kudla Kitchen server. Please check XAMPP or your connection.',
                errors: [err.message]
            };
        }
    },

    // Auth API Callers
    async login(email, password) {
        const response = await this.request('/api/auth/login.php', 'POST', { email, password });
        if (response.success && response.data && response.data.token) {
            this.setToken(response.data.token);
            if (response.data.user) {
                this.setUser(response.data.user);
            }
        }
        return response;
    },

    async register(name, email, phone, password) {
        return this.request('/api/auth/register.php', 'POST', {
            name,
            email,
            phone,
            password,
            role: 'customer'
        });
    },

    async getProfile() {
        const response = await this.request('/api/auth/profile.php', 'GET');
        if (response.success && response.data) {
            this.setUser(response.data);
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

    // Category & Food Callers
    async getCategories() {
        return this.request('/api/categories/get.php', 'GET');
    },

    async getFood(categoryId = 0, search = '') {
        const params = [];
        if (categoryId > 0) params.push(`category_id=${categoryId}`);
        if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        return this.request(`/api/food/get.php${queryString}`, 'GET');
    },

    async getFoodSingle(id) {
        return this.request(`/api/food/get_single.php?id=${parseInt(id, 10)}`, 'GET');
    },

    // Cart Callers
    async getCart() {
        return this.request('/api/cart/get.php', 'GET');
    },

    async addToCart(foodId, quantity = 1) {
        return this.request('/api/cart/add.php', 'POST', {
            food_id: parseInt(foodId, 10),
            quantity: parseInt(quantity, 10)
        });
    },

    async updateCartItem(itemId, quantity) {
        return this.request('/api/cart/update.php', 'POST', {
            item_id: parseInt(itemId, 10),
            quantity: parseInt(quantity, 10)
        });
    },

    async removeCartItem(itemId) {
        return this.request('/api/cart/remove.php', 'POST', {
            item_id: parseInt(itemId, 10)
        });
    },

    async clearCart() {
        return this.request('/api/cart/clear.php', 'POST');
    },

    // Delivery & Address Callers
    async getAddresses() {
        return this.request('/api/addresses/get.php', 'GET');
    },

    async addAddress(addressData) {
        return this.request('/api/addresses/add.php', 'POST', addressData);
    },

    async calculateDeliveryCharge(distanceKm = 2.5) {
        return this.request(`/api/delivery/calculate_charge.php?distance_km=${distanceKm}`, 'GET');
    },

    // Coupon Caller
    async validateCoupon(code, subtotal) {
        return this.request('/api/coupons/validate.php', 'POST', {
            code: code.trim(),
            subtotal: parseFloat(subtotal)
        });
    },

    // Order Creation Caller
    async createOrder(orderData) {
        return this.request('/api/orders/create.php', 'POST', orderData);
    },

    // Orders History & Tracking Callers
    async getOrders() {
        return this.request('/api/orders/get.php', 'GET');
    },

    async getOrderSingle(orderId) {
        return this.request(`/api/orders/get_single.php?id=${parseInt(orderId, 10)}`, 'GET');
    },

    async cancelOrder(orderId) {
        return this.request('/api/orders/cancel.php', 'POST', {
            order_id: parseInt(orderId, 10)
        });
    },

    // Review Callers
    async addReview(orderId, foodId, rating, comment = '') {
        return this.request('/api/reviews/add.php', 'POST', {
            order_id: parseInt(orderId, 10),
            food_id: parseInt(foodId, 10),
            rating: parseInt(rating, 10),
            comment: comment.trim()
        });
    },

    // Payment Callers
    async verifyPayment(transactionId) {
        return this.request('/api/payments/verify.php', 'POST', {
            transaction_id: transactionId
        });
    }
};
