/**
 * Kudla Kitchen - Delivery Partner API Helper
 */

const getDeliveryApiBaseUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const folderName = 'restaurant-delivery-system';
    const folderIndex = pathname.indexOf(folderName);
    
    if (folderIndex !== -1) {
        return `${origin}${pathname.substring(0, folderIndex + folderName.length)}`;
    }
    return origin;
};

const DELIVERY_API_BASE_URL = getDeliveryApiBaseUrl();

const DeliveryAPI = {
    getToken() {
        return localStorage.getItem('kk_delivery_token');
    },
    
    setToken(token) {
        localStorage.setItem('kk_delivery_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('kk_delivery_token');
        localStorage.removeItem('kk_delivery_user');
    },
    
    getUser() {
        const user = localStorage.getItem('kk_delivery_user');
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem('kk_delivery_user', JSON.stringify(user));
    },
    
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!token && user && (user.role === 'delivery_partner' || user.role === 'admin');
    },

    async request(endpoint, method = 'GET', data = null) {
        const url = `${DELIVERY_API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers, credentials: 'include' };
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            let json = {};
            try {
                json = await response.json();
            } catch (e) {
                return { success: false, message: `Non-JSON response (Status: ${response.status})` };
            }

            if (!response.ok || json.success === false) {
                if (response.status === 401 || response.status === 403) {
                    this.removeToken();
                }
                return {
                    success: false,
                    message: json.message || `Error ${response.status}`,
                    statusCode: response.status
                };
            }

            return json;
        } catch (err) {
            return { success: false, message: 'Server connection error.' };
        }
    },

    async login(email, password) {
        const response = await this.request('/api/auth/login.php', 'POST', { email, password });
        if (response.success && response.data && response.data.token) {
            const user = response.data.user;
            if (user && (user.role === 'delivery_partner' || user.role === 'admin')) {
                this.setToken(response.data.token);
                this.setUser(user);
            } else {
                return {
                    success: false,
                    message: "Access Denied. Delivery Partner or Administrator permissions required."
                };
            }
        }
        return response;
    },

    async getProfile() {
        const response = await this.request('/api/auth/profile.php', 'GET');
        if (response.success && response.data) {
            if (response.data.role === 'delivery_partner' || response.data.role === 'admin') {
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
        } catch (e) {}
        this.removeToken();
        return { success: true };
    },

    async getDashboard() {
        return this.request('/delivery_partner/dashboard.php', 'GET');
    },

    async getMyOrders() {
        return this.request('/delivery_partner/orders.php', 'GET');
    },

    async updateDeliveryStatus(orderId, status) {
        return this.request('/delivery_partner/update_status.php', 'POST', {
            order_id: parseInt(orderId, 10),
            status: status
        });
    }
};
