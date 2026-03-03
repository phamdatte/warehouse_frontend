import api from './axios';

export const adminApi = {
    // Users
    getUsers: (params) => api.get('/api/admin/users', { params }),
    createUser: (data) => api.post('/api/admin/users', data),
    updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
    toggleActive: (id) => api.patch(`/api/admin/users/${id}/toggle-active`),
    changeRole: (id, roleId) => api.patch(`/api/admin/users/${id}/role`, { roleId }),

    // Roles
    getRoles: () => api.get('/api/admin/roles'),
    createRole: (data) => api.post('/api/admin/roles', data),
    updateRole: (id, data) => api.put(`/api/admin/roles/${id}`, data),
    toggleRole: (id) => api.patch(`/api/admin/roles/${id}/toggle-active`),
    getRolePages: (roleId) => api.get(`/api/admin/roles/${roleId}/pages`),
    saveRolePages: (roleId, data) => api.put(`/api/admin/roles/${roleId}/pages`, data),
};

