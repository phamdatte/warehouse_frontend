import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ReportInventoryPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const fetchPage = useCallback(async (p = 0) => {
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

    useEffect(() => { fetchPage(0); }, [fetchPage]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await reportApi.getInventory({ page: 0, size: 10000 });
            const rows = (res.data.content || []).map((r) => ({
                'Product Code':       r.productCode || '',
                'Product Name':       r.productName || '',
                'Category':           r.categoryName || '',
                'Unit':               r.unit || '',
                'In Stock':           r.currentQuantity != null ? Number(r.currentQuantity) : 0,
                'Total Receipts':     r.totalReceipt   != null ? Number(r.totalReceipt)    : 0,
                'Total Issues':       r.totalIssue     != null ? Number(r.totalIssue)      : 0,
                'Unit Price (VND)':   r.unitPrice      != null ? Number(r.unitPrice)       : 0,
                'Inventory Value (VND)': r.inventoryValue != null ? Number(r.inventoryValue) : 0,
                'Last Updated':       r.lastUpdated ? new Date(r.lastUpdated).toLocaleString('en-US') : '',
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [
                { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 8 },
                { wch: 12 }, { wch: 14 }, { wch: 12 },
                { wch: 18 }, { wch: 22 }, { wch: 20 },
            ];

            // Totals row
            const totalValue = rows.reduce((s, r) => s + (r['Inventory Value (VND)'] || 0), 0);
            XLSX.utils.sheet_add_aoa(ws, [
                ['', '', '', '', '', '', '', 'TOTAL VALUE', totalValue, '']
            ], { origin: -1 });

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
            XLSX.writeFile(wb, `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success(`Exported ${rows.length} products`);
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const totalStockValue = data.reduce((s, r) => s + (Number(r.inventoryValue) || 0), 0);
    const lowStockCount   = data.filter((r) => Number(r.currentQuantity) <= 10).length;

    const columns = [
        { key: 'productCode', label: 'Code', width: '90px' },
        { key: 'productName', label: 'Product Name' },
        { key: 'categoryName', label: 'Category', width: '130px' },
        { key: 'unit', label: 'Unit', width: '70px' },
        {
            key: 'currentQuantity', label: 'In Stock', width: '100px',
            render: (v) => (
                <span className={`font-bold ${Number(v) <= 10 ? 'text-red-600' : 'text-slate-800'}`}>
                    {Number(v).toLocaleString('en-US')}
                </span>
            ),
        },
        {
            key: 'totalReceipt', label: 'Receipts', width: '100px',
            render: (v) => <span className="text-green-600 font-medium">{Number(v).toLocaleString('en-US')}</span>,
        },
        {
            key: 'totalIssue', label: 'Issues', width: '100px',
            render: (v) => <span className="text-red-600 font-medium">{Number(v).toLocaleString('en-US')}</span>,
        },
        {
            key: 'inventoryValue', label: 'Value (VND)', width: '150px',
            render: (v) => <span className="font-semibold">{Number(v).toLocaleString('vi-VN')}₫</span>,
        },
    ];

    return (
        <div>
            <PageHeader title="Inventory Report" subtitle={`${totalElements} products`}>
                <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-1.5">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
            </PageHeader>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Products</div>
                    <div className="text-2xl font-bold text-slate-800">{totalElements}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Inventory Value (page)</div>
                    <div className="text-2xl font-bold text-primary-600">{totalStockValue.toLocaleString('vi-VN')}₫</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Low Stock (≤10)</div>
                    <div className="text-2xl font-bold text-red-500">{lowStockCount}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetchPage} />
                </div>
            </div>
        </div>
    );
}
