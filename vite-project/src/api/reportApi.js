import api from './axios';

// Helper: "2026-03-16" → "2026-03-16T00:00:00" / "2026-03-16T23:59:59"
const toStart = (d) => d ? `${d}T00:00:00` : undefined;
const toEnd   = (d) => d ? `${d}T23:59:59` : undefined;

export const reportApi = {
    getReceipts: ({ fromDate, toDate, ...rest } = {}) => api.get('/api/reports/receipt', {
        params: {
            ...rest,
            ...(fromDate ? { from: toStart(fromDate) } : {}),
            ...(toDate   ? { to:   toEnd(toDate)     } : {}),
        }
    }),

    getIssues: ({ fromDate, toDate, ...rest } = {}) => api.get('/api/reports/issue', {
        params: {
            ...rest,
            ...(fromDate ? { from: toStart(fromDate) } : {}),
            ...(toDate   ? { to:   toEnd(toDate)     } : {}),
        }
    }),

    getInventory: (params) => api.get('/api/reports/inventory', { params }),
};
