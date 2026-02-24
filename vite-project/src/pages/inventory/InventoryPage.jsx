import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { inventoryApi } from '../../api/inventoryApi';
import { masterApi } from '../../api/masterApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

export default function InventoryPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({ categoryId: '', search: '' });

    useEffect(() => {
        masterApi.getCategories({ size: 100 }).then((r) => setCategories(r.data.content || []));
    }, []);

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const params = { page: p, size: 15 };
            if (filters.categoryId) params.categoryId = filters.categoryId;
            if (filters.search) params.search = filters.search;
            const res = await inventoryApi.getAll(params);
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Không thể tải dữ liệu tồn kho');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetch(0); }, [fetch]);

    // Tổng tồn kho hiện tại
    const totalStock = data.reduce((s, r) => s + (r.currentQuantity || 0), 0);
    const lowStockCount = data.filter((r) => r.currentQuantity <= 10).length;

    const columns = [
        { key: 'productCode', label: 'Mã SP', width: '100px' },
        { key: 'productName', label: 'Tên sản phẩm' },
        { key: 'categoryName', label: 'Danh mục', width: '140px' },
        { key: 'unit', label: 'ĐVT', width: '80px' },
        {
            key: 'currentQuantity', label: 'Tồn kho', width: '110px',
            render: (v) => {
                const isLow = v <= 10;
                return (
                    <span className={`font-semibold text-sm ${isLow ? 'text-red-600' : 'text-green-700'}`}>
                        {v?.toLocaleString('vi-VN')} {isLow && <span className="text-xs font-normal ml-1">⚠️</span>}
                    </span>
                );
            },
        },
        {
            key: 'lastUpdated', label: 'Cập nhật lần cuối', width: '150px',
            render: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—'
        },
    ];

    return (
        <div>
            <PageHeader title="Tồn kho hiện tại" subtitle={`${totalElements} sản phẩm đang quản lý`} />

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tổng sản phẩm</div>
                    <div className="text-2xl font-bold text-slate-800">{totalElements.toLocaleString('vi-VN')}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tổng tồn kho (trang này)</div>
                    <div className="text-2xl font-bold text-primary-600">{totalStock.toLocaleString('vi-VN')}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sắp hết hàng (≤10)</div>
                    <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {lowStockCount}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="label">Tìm kiếm</label>
                            <input type="text" value={filters.search} placeholder="Tên sản phẩm, mã SP..."
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="input w-52" />
                        </div>
                        <div>
                            <label className="label">Danh mục</label>
                            <select value={filters.categoryId}
                                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })} className="input w-44">
                                <option value="">Tất cả</option>
                                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                            </select>
                        </div>
                        <button onClick={() => fetch(0)} className="btn-primary btn-sm h-9">Tìm kiếm</button>
                        <button onClick={() => setFilters({ categoryId: '', search: '' })} className="btn-secondary btn-sm h-9">Xóa filter</button>
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
