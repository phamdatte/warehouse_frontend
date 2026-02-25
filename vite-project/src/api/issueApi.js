import api from './axios';

export const issueApi = {
    getAll: (params) => api.get('/api/issues', { params }),
    getById: (id) => api.get(`/api/issues/${id}`),
    create: (data) => api.post('/api/issues', data),
    update: (id, data) => api.put(`/api/issues/${id}`, data),
    approve: (id) => api.put(`/api/issues/${id}/approve`),
    cancel: (id) => api.put(`/api/issues/${id}/cancel`),
};
