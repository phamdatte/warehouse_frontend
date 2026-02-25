import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { issueApi } from '../../api/issueApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const STATUS_OPTIONS = ['', 'Pending', 'Approved', 'Completed', 'Cancelled'];

export default function IssueListPage() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ status: '', fromDate: '', toDate: '' });

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const params = { page: p, size: 10 };
            if (filters.status) params.status = filters.status;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
            const res = await issueApi.getAll(params);
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Failed to load issue list');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    const columns = [
        { key: 'issueNumber', label: 'Issue No.', width: '130px' },
        { key: 'customerName', label: 'Customer' },
        {
            key: 'issueDate', label: 'Issue Date', width: '150px',
            render: (v) => v ? new Date(v).toLocaleDateString('en-US') : '—'
        },
        {
            key: 'status', label: 'Status', width: '120px',
            render: (v) => <StatusBadge status={v} />
        },
        { key: 'createdByName', label: 'Created By', width: '130px' },
        {
            key: 'action', label: '', width: '80px',
            render: (_, row) => (
                <button onClick={() => navigate(`/issue/${row.issueId}`)}
                    className="text-primary-500 hover:text-primary-700 text-xs font-medium">View</button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="Goods Issues" subtitle="Manage goods issued to customers">
                <button onClick={() => navigate('/issue/create')} className="btn-primary">+ Create Issue</button>
            </PageHeader>

            <div className="card mb-6">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="label">Status</label>
                            <select name="status" value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input w-40">
                                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
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
                        <button onClick={() => setFilters({ status: '', fromDate: '', toDate: '' })} className="btn-secondary btn-sm h-9">Clear filter</button>
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
