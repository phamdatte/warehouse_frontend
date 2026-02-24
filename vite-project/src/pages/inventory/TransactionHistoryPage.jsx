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
            toast.error('Không thể tải lịch sử giao dịch');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    const columns = [
        {
            key: 'transactionDate', label: 'Ngày GD', width: '150px',
            render: (v) => v ? new Date(v).toLocaleString('vi-VN') : '—',
        },
        { key: 'productName', label: 'Sản phẩm' },
        {
            key: 'transactionType', label: 'Loại', width: '90px',
            render: (v) => (
                <span className={`badge ${v === 'Receipt' ? 'badge-approved' : 'badge-cancelled'}`}>
                    {v === 'Receipt' ? '📥 Nhập' : '📤 Xuất'}
                </span>
            ),
        },
        {
            key: 'quantity', label: 'Số lượng', width: '100px',
            render: (v, row) => (
                <span className={`font-semibold ${row.transactionType === 'Receipt' ? 'text-green-600' : 'text-red-600'}`}>
                    {row.transactionType === 'Receipt' ? '+' : '-'}{v?.toLocaleString('vi-VN')}
                </span>
            ),
        },
        { key: 'referenceNumber', label: 'Số phiếu', width: '130px' },
        { key: 'performedBy', label: 'Người thực hiện', width: '130px' },
    ];

    return (
        <div>
            <PageHeader title="Lịch sử giao dịch" subtitle={`${totalElements} giao dịch`} />

            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="label">Loại giao dịch</label>
                            <select value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input w-36">
                                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t || 'Tất cả'}</option>)}
                            </select>
                        </div>
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
                        <button onClick={() => fetch(0)} className="btn-primary btn-sm h-9">Tìm kiếm</button>
                        <button onClick={() => setFilters({ type: '', fromDate: '', toDate: '', productId: '' })} className="btn-secondary btn-sm h-9">Xóa filter</button>
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
