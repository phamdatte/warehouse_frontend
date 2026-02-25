import api from './axios';

export const receiptApi = {
    getAll: (params) => api.get('/api/receipts', { params }),
    getById: (id) => api.get(`/api/receipts/${id}`),
    create: (data) => api.post('/api/receipts', data),
    update: (id, data) => api.put(`/api/receipts/${id}`, data),
    approve: (id) => api.put(`/api/receipts/${id}/approve`),
    cancel: (id) => api.put(`/api/receipts/${id}/cancel`),
};
