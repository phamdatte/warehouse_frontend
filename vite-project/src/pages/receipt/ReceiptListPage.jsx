import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { receiptApi } from '../../api/receiptApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const STATUS_OPTIONS = ['', 'Pending', 'Approved', 'Completed', 'Cancelled'];

export default function ReceiptListPage() {
    const navigate = useNavigate();
    const { isManager } = useAuth();
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
            const res = await receiptApi.getAll(params);
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Không thể tải danh sách phiếu nhập');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const columns = [
        { key: 'receiptNumber', label: 'Số phiếu', width: '130px' },
        { key: 'vendorName', label: 'Nhà cung cấp' },
        {
            key: 'receiptDate', label: 'Ngày nhập', width: '150px',
            render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
        },
        {
            key: 'status', label: 'Trạng thái', width: '120px',
            render: (v) => <StatusBadge status={v} />
        },
        { key: 'createdByName', label: 'Người tạo', width: '130px' },
        {
            key: 'action', label: '', width: '80px',
            render: (_, row) => (
                <button
                    onClick={() => navigate(`/receipt/${row.receiptId}`)}
                    className="text-primary-500 hover:text-primary-700 text-xs font-medium"
                >
                    Xem
                </button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="Phiếu nhập kho" subtitle="Quản lý nhập hàng từ nhà cung cấp">
                <button onClick={() => navigate('/receipt/create')} className="btn-primary">
                    + Tạo phiếu nhập
                </button>
            </PageHeader>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="label">Trạng thái</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="input w-40">
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s || 'Tất cả'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Từ ngày</label>
                            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="input w-40" />
                        </div>
                        <div>
                            <label className="label">Đến ngày</label>
                            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="input w-40" />
                        </div>
                        <button onClick={() => fetch(0)} className="btn-primary btn-sm h-9">Tìm kiếm</button>
                        <button onClick={() => setFilters({ status: '', fromDate: '', toDate: '' })} className="btn-secondary btn-sm h-9">Xóa filter</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body p-0 pt-0">
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={loading}
                        pagination={{ page, totalPages, totalElements }}
                        onPageChange={fetch}
                    />
                </div>
            </div>
        </div>
    );
}
