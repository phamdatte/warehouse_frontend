import api from './axios';

export const reportApi = {
    // Truyền from/to dạng ISO string nếu có
    getReceipts: ({ fromDate, toDate, ...rest } = {}) => api.get('/api/reports/receipt', {
        params: {
            ...rest,
            ...(fromDate ? { from: new Date(fromDate).toISOString().slice(0, 19) } : {}),
            ...(toDate ? { to: new Date(toDate).toISOString().slice(0, 19) } : {}),
        }
    }),
    getIssues: ({ fromDate, toDate, ...rest } = {}) => api.get('/api/reports/issue', {
        params: {
            ...rest,
            ...(fromDate ? { from: new Date(fromDate).toISOString().slice(0, 19) } : {}),
            ...(toDate ? { to: new Date(toDate).toISOString().slice(0, 19) } : {}),
        }
    }),
    getInventory: (params) => api.get('/api/reports/inventory', { params }),
};
