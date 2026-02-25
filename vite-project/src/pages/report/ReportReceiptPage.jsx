import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

export default function ReportReceiptPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ fromDate: '', toDate: '' });

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const params = { page: p, size: 15 };
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
            const res = await reportApi.getReceipts(params);
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Failed to load receipt report');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    const columns = [
        { key: 'receiptNumber', label: 'Receipt No.', width: '130px' },
        { key: 'vendorName', label: 'Vendor' },
        {
            key: 'receiptDate', label: 'Receipt Date', width: '140px',
            render: (v) => v ? new Date(v).toLocaleDateString('en-US') : '—'
        },
        { key: 'status', label: 'Status', width: '120px', render: (v) => <StatusBadge status={v} /> },
        {
            key: 'totalAmount', label: 'Total Amount', width: '140px',
            render: (v) => v ? `${v.toLocaleString('en-US')}₫` : '—'
        },
        { key: 'approvedByName', label: 'Approved By', width: '130px' },
    ];

    return (
        <div>
            <PageHeader title="Goods Receipt Report" subtitle={`${totalElements} approved receipts`} />
            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
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
                        <button onClick={() => fetch(0)} className="btn-primary btn-sm h-9">View Report</button>
                        <button onClick={() => setFilters({ fromDate: '', toDate: '' })} className="btn-secondary btn-sm h-9">Clear filter</button>
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
