/**
 * Kudla Kitchen - Kitchen API Helper
 */

const getKitchenApiBaseUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const folderName = 'restaurant-delivery-system';
    const folderIndex = pathname.indexOf(folderName);
    
    if (folderIndex !== -1) {
        return `${origin}${pathname.substring(0, folderIndex + folderName.length)}`;
    }
    return origin;
};

const KITCHEN_API_BASE_URL = getKitchenApiBaseUrl();

const KitchenAPI = {
    getToken() {
        return localStorage.getItem('kk_kitchen_token');
    },
    
    setToken(token) {
        localStorage.setItem('kk_kitchen_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('kk_kitchen_token');
        localStorage.removeItem('kk_kitchen_user');
    },
    
    getUser() {
        const user = localStorage.getItem('kk_kitchen_user');
        try {
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem('kk_kitchen_user', JSON.stringify(user));
    },
    
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getUser();
        return !!token && user && (user.role === 'kitchen' || user.role === 'admin');
    },

    async request(endpoint, method = 'GET', data = null) {
        const url = `${KITCHEN_API_BASE_URL}${endpoint}`;
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
            if (user && (user.role === 'kitchen' || user.role === 'admin')) {
                this.setToken(response.data.token);
                this.setUser(user);
            } else {
                return {
                    success: false,
                    message: "Access Denied. Kitchen Staff or Administrator permissions required."
                };
            }
        }
        return response;
    },

    async getProfile() {
        const response = await this.request('/api/auth/profile.php', 'GET');
        if (response.success && response.data) {
            if (response.data.role === 'kitchen' || response.data.role === 'admin') {
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
        return this.request('/kitchen/dashboard.php', 'GET');
    },

    async getOrders() {
        return this.request('/kitchen/orders.php', 'GET');
    },

    async updateOrderStatus(orderId, orderStatus) {
        return this.request('/kitchen/update_order.php', 'POST', {
            order_id: parseInt(orderId, 10),
            order_status: orderStatus
        });
    }
};
