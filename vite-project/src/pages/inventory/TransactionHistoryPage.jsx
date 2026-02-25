import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { inventoryApi } from '../../api/inventoryApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

const TYPE_OPTIONS = ['', 'Receipt', 'Issue'];

export default function TransactionHistoryPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ type: '', fromDate: '', toDate: '', productId: '' });

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const params = { page: p, size: 15 };
            if (filters.type) params.type = filters.type;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
            if (filters.productId) params.productId = filters.productId;
            const res = await inventoryApi.getTransactions(params);
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    const columns = [
        {
            key: 'transactionDate', label: 'Transaction Date', width: '150px',
            render: (v) => v ? new Date(v).toLocaleString('en-US') : '—',
        },
        { key: 'productName', label: 'Product' },
        {
            key: 'transactionType', label: 'Type', width: '90px',
            render: (v) => (
                <span className={`badge ${v === 'Receipt' ? 'badge-approved' : 'badge-cancelled'}`}>
                    {v === 'Receipt' ? '📥 Receipt' : '📤 Issue'}
                </span>
            ),
        },
        {
            key: 'quantity', label: 'Qty', width: '100px',
            render: (v, row) => (
                <span className={`font-semibold ${row.transactionType === 'Receipt' ? 'text-green-600' : 'text-red-600'}`}>
                    {row.transactionType === 'Receipt' ? '+' : '-'}{v?.toLocaleString('en-US')}
                </span>
            ),
        },
        { key: 'referenceNumber', label: 'Ref No.', width: '130px' },
        { key: 'performedBy', label: 'Performed By', width: '130px' },
    ];

    return (
        <div>
            <PageHeader title="Transaction History" subtitle={`${totalElements} transactions`} />

            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="label">Transaction Type</label>
                            <select value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input w-36">
                                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t || 'All'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">From Date</label>
                            <input type="date" value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="input w-40" />
                        </div>
                        <div>
                            <label className="label">To Date</label>
                            <input type="date" value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="input w-40" />
                        </div>
                        <button onClick={() => fetch(0)} className="btn-primary btn-sm h-9">Search</button>
                        <button onClick={() => setFilters({ type: '', fromDate: '', toDate: '', productId: '' })} className="btn-secondary btn-sm h-9">Clear filter</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
                </div>
            </div>
        </div>
    );
}
