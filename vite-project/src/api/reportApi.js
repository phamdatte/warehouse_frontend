import api from './axios';

export const reportApi = {
    getReceipts: (params) => api.get('/api/reports/receipt', { params }),
    getIssues: (params) => api.get('/api/reports/issue', { params }),
    getInventory: (params) => api.get('/api/reports/inventory', { params }),
};
