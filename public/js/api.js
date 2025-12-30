/**
 * Olive Store - API Helper Module
 * Handles all API requests with authentication
 */
const Api = (function () {

    // Get auth token
    function getToken() {
        return localStorage.getItem(Config.TOKEN_KEY);
    }

    // Get admin token
    function getAdminToken() {
        return localStorage.getItem(Config.ADMIN_TOKEN_KEY);
    }

    // Build headers
    function buildHeaders(isAdmin = false, isFormData = false) {
        const headers = {};

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const token = isAdmin ? getAdminToken() : getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Generic request handler
    async function request(endpoint, options = {}) {
        const url = `${Config.API_URL}${endpoint}`;
        const isAdmin = options.admin || false;
        const isFormData = options.body instanceof FormData;

        const fetchOptions = {
            method: options.method || 'GET',
            headers: buildHeaders(isAdmin, isFormData),
        };

        if (options.body) {
            fetchOptions.body = isFormData ? options.body : JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            if (!response.ok) {
                throw { status: response.status, message: data.message || 'Request failed', data };
            }

            return data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw { status: 0, message: error.message || 'Network error' };
        }
    }

    // Public API methods
    return {
        // GET request
        get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),

        // POST request
        post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),

        // PUT request
        put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),

        // DELETE request
        delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),

        // ===== AUTH ENDPOINTS =====
        auth: {
            login: (email, password) => Api.post('/auth/login', { email, password }),
            register: (data) => Api.post('/auth/register', data),
            forgotPassword: (email) => Api.post('/auth/forgot-password', { email }),
            resetPassword: (token, password) => Api.post('/auth/reset-password', { token, password }),
            verifyEmail: (token) => Api.get(`/auth/verify-email/${token}`),
            resendVerification: (email) => Api.post('/auth/resend-verification', { email }),
            me: () => Api.get('/auth/me'),
            updateProfile: (data) => Api.put('/auth/profile', data),
            updatePassword: (currentPassword, newPassword) => Api.put('/auth/password', { current_password: currentPassword, new_password: newPassword }),
        },

        // ===== CATALOG ENDPOINTS =====
        categories: {
            list: () => Api.get('/categories'),
            get: (slug) => Api.get(`/categories/${slug}`),
            products: (slug, params = {}) => {
                const query = new URLSearchParams(params).toString();
                return Api.get(`/categories/${slug}/products${query ? '?' + query : ''}`);
            },
        },

        products: {
            list: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return Api.get(`/products${query ? '?' + query : ''}`);
            },
            get: (slug) => Api.get(`/products/${slug}`),
            search: (q, params = {}) => {
                const query = new URLSearchParams({ q, ...params }).toString();
                return Api.get(`/products?${query}`);
            },
        },

        // ===== ORDERS ENDPOINTS =====
        orders: {
            create: (data) => Api.post('/orders', data),
            list: () => Api.get('/orders'),
            get: (orderNumber) => Api.get(`/orders/${orderNumber}`),
            uploadPaymentProof: (orderNumber, formData) => Api.post(`/orders/${orderNumber}/payment-proof`, formData),
            cancel: (orderNumber) => Api.post(`/orders/${orderNumber}/cancel`),
        },

        // ===== ADDRESSES ENDPOINTS =====
        addresses: {
            list: () => Api.get('/addresses'),
            create: (data) => Api.post('/addresses', data),
            update: (id, data) => Api.put(`/addresses/${id}`, data),
            delete: (id) => Api.delete(`/addresses/${id}`),
            setDefault: (id) => Api.put(`/addresses/${id}/default`),
        },

        // ===== SETTINGS ENDPOINTS =====
        settings: {
            public: () => Api.get('/settings/public'),
        },

        // ===== ADMIN ENDPOINTS =====
        admin: {
            // Auth
            login: (email, password) => Api.post('/auth/login', { email, password }),

            // Dashboard
            dashboard: {
                getStats: () => Api.get('/admin/dashboard', { admin: true }),
            },

            // Categories
            categories: {
                list: () => Api.get('/admin/categories', { admin: true }),
                get: (id) => Api.get(`/admin/categories/${id}`, { admin: true }),
                create: (data) => Api.post('/admin/categories', data, { admin: true }),
                update: (id, data) => Api.put(`/admin/categories/${id}`, data, { admin: true }),
                delete: (id) => Api.delete(`/admin/categories/${id}`, { admin: true }),
            },

            // Products
            products: {
                list: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return Api.get(`/admin/products${query ? '?' + query : ''}`, { admin: true });
                },
                get: (id) => Api.get(`/admin/products/${id}`, { admin: true }),
                create: (data) => Api.post('/admin/products', data, { admin: true }),
                update: (id, data) => Api.put(`/admin/products/${id}`, data, { admin: true }),
                delete: (id) => Api.delete(`/admin/products/${id}`, { admin: true }),
            },

            // Orders
            orders: {
                list: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return Api.get(`/admin/orders${query ? '?' + query : ''}`, { admin: true });
                },
                get: (orderNumber) => Api.get(`/admin/orders/${orderNumber}`, { admin: true }),
                updateStatus: (orderNumber, status) => Api.put(`/admin/orders/${orderNumber}/status`, { status }, { admin: true }),
                updatePayment: (orderNumber, paymentStatus) => Api.put(`/admin/orders/${orderNumber}/status`, { payment_status: paymentStatus }, { admin: true }),
            },

            // Customers
            customers: {
                list: (params = {}) => {
                    const query = new URLSearchParams(params).toString();
                    return Api.get(`/admin/customers${query ? '?' + query : ''}`, { admin: true });
                },
                get: (id) => Api.get(`/admin/customers/${id}`, { admin: true }),
                orders: (id) => Api.get(`/admin/customers/${id}/orders`, { admin: true }),
            },

            // Files
            files: {
                list: () => Api.get('/admin/files', { admin: true }),
                getUploadUrl: (fileName) => Api.post('/files/upload-url', { file_name: fileName }, { admin: true }),
                delete: (id) => Api.delete(`/admin/files/${id}`, { admin: true }),
            },

            // Settings
            settings: {
                list: () => Api.get('/admin/settings', { admin: true }),
                update: (data) => Api.put('/admin/settings', data, { admin: true }),
            },
        },
    };
})();

// Make available globally
window.Api = Api;
