import api from './axios';

export const inventoryApi = {
    getAll: (params) => api.get('/api/inventory', { params }),
    getTransactions: (params) => api.get('/api/inventory/transactions', { params }),
};
