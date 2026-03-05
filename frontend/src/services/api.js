import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// Categories API
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    addSubcategory: (id, data) => api.post(`/categories/${id}/subcategory`, data),
    removeSubcategory: (id, subId) => api.delete(`/categories/${id}/subcategory/${subId}`)
};

// Products API
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getFeatured: () => api.get('/products/featured'),
    getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }),
    delete: (id) => api.delete(`/products/${id}`)
};

// Cart API
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (productId, quantity = 1, weight = null) =>
        api.post('/cart', { productId, quantity, weight }),
    update: (productId, quantity, weight = null) =>
        api.put(`/cart/${productId}`, { quantity, weight }),
    remove: (productId) => api.delete(`/cart/${productId}`),
    clear: () => api.delete('/cart')
};

// Orders API
export const ordersAPI = {
    create: (data) => api.post('/orders', data),
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    cancel: (id) => api.put(`/orders/${id}/cancel`),
    // Admin
    getAllAdmin: (params) => api.get('/orders/admin/all', { params }),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
};

// Payment API
export const paymentAPI = {
    createOrder: (data) => api.post('/payment/create-order', data),
    verifyPayment: (data) => api.post('/payment/verify', data),
    getKey: () => api.get('/payment/key')
};

export default api;
