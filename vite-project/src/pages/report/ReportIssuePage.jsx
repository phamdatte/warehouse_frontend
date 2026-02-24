import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

export default function ReportIssuePage() {
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
            const res = await reportApi.getIssues(params);
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Không thể tải báo cáo xuất kho');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    const columns = [
        { key: 'issueNumber', label: 'Số phiếu', width: '130px' },
        { key: 'customerName', label: 'Khách hàng' },
        {
            key: 'issueDate', label: 'Ngày xuất', width: '140px',
            render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
        },
        { key: 'status', label: 'Trạng thái', width: '120px', render: (v) => <StatusBadge status={v} /> },
        {
            key: 'totalAmount', label: 'Tổng tiền', width: '140px',
            render: (v) => v ? `${v.toLocaleString('vi-VN')}₫` : '—'
        },
        { key: 'approvedByName', label: 'Người duyệt', width: '130px' },
    ];

    return (
        <div>
            <PageHeader title="Báo cáo xuất kho" subtitle={`${totalElements} phiếu đã duyệt`} />
            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="label">Từ ngày</label>
                            <input type="date" value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="input w-40" />
                        </div>
                        <div>
                            <label className="label">Đến ngày</label>
                            <input type="date" value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="input w-40" />
                        </div>
                        <button onClick={() => fetch(0)} className="btn-primary btn-sm h-9">Xem báo cáo</button>
                        <button onClick={() => setFilters({ fromDate: '', toDate: '' })} className="btn-secondary btn-sm h-9">Xóa filter</button>
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
