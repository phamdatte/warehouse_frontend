import api from './axios';

export const adminApi = {
    getUsers: (params) => api.get('/api/admin/users', { params }),
    createUser: (data) => api.post('/api/admin/users', data),
    toggleActive: (id) => api.patch(`/api/admin/users/${id}/toggle-active`),
    changeRole: (id, roleId) => api.patch(`/api/admin/users/${id}/role`, { roleId }),
};
