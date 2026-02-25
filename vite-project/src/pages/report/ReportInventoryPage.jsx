import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

export default function ReportInventoryPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await reportApi.getInventory({ page: p, size: 20 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Failed to load inventory report');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(0); }, [fetch]);

    const totalStock = data.reduce((s, r) => s + (r.currentQuantity || 0), 0);

    const columns = [
        { key: 'productCode', label: 'Product Code', width: '100px' },
        { key: 'productName', label: 'Product Name' },
        { key: 'categoryName', label: 'Category', width: '140px' },
        { key: 'unit', label: 'Unit', width: '80px' },
        {
            key: 'currentQuantity', label: 'In Stock', width: '110px',
            render: (v) => (
                <span className={`font-bold ${v <= 10 ? 'text-red-600' : 'text-slate-800'}`}>
                    {v?.toLocaleString('en-US')}
                </span>
            ),
        },
        {
            key: 'totalReceipt', label: 'Total Receipts', width: '110px',
            render: (v) => <span className="text-green-600 font-medium">{v?.toLocaleString('en-US') ?? '—'}</span>,
        },
        {
            key: 'totalIssue', label: 'Total Issues', width: '110px',
            render: (v) => <span className="text-red-600 font-medium">{v?.toLocaleString('en-US') ?? '—'}</span>,
        },
    ];

    return (
        <div>
            <PageHeader title="Inventory Report" subtitle={`${totalElements} products`} />
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Products</div>
                    <div className="text-2xl font-bold text-slate-800">{totalElements}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Stock (this page)</div>
                    <div className="text-2xl font-bold text-primary-600">{totalStock.toLocaleString('en-US')}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Low Stock (≤10)</div>
                    <div className="text-2xl font-bold text-red-500">{data.filter((r) => r.currentQuantity <= 10).length}</div>
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
