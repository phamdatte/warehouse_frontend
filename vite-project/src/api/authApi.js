import api from './axios';

export const authApi = {
    login: (data) => api.post('/api/auth/login', data),
    logout: () => api.post('/api/auth/logout'),
    getMyPages: () => api.get('/api/auth/me/pages'),
};
