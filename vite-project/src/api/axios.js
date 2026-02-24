import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' },
});

// Request: attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('wms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response: handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('wms_token');
            localStorage.removeItem('wms_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
