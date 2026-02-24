import api from './axios';

export const masterApi = {
    // Products
    getProducts: (params) => api.get('/api/products', { params }),
    getProductById: (id) => api.get(`/api/products/${id}`),
    createProduct: (data) => api.post('/api/products', data),
    updateProduct: (id, d) => api.put(`/api/products/${id}`, d),
    deleteProduct: (id) => api.delete(`/api/products/${id}`),

    // Categories
    getCategories: (params) => api.get('/api/categories', { params }),
    createCategory: (data) => api.post('/api/categories', data),
    updateCategory: (id, d) => api.put(`/api/categories/${id}`, d),
    deleteCategory: (id) => api.delete(`/api/categories/${id}`),

    // Vendors
    getVendors: (params) => api.get('/api/vendors', { params }),
    createVendor: (data) => api.post('/api/vendors', data),
    updateVendor: (id, d) => api.put(`/api/vendors/${id}`, d),
    deleteVendor: (id) => api.delete(`/api/vendors/${id}`),

    // Customers
    getCustomers: (params) => api.get('/api/customers', { params }),
    createCustomer: (data) => api.post('/api/customers', data),
    updateCustomer: (id, d) => api.put(`/api/customers/${id}`, d),
    deleteCustomer: (id) => api.delete(`/api/customers/${id}`),
};
