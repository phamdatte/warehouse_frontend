import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { reportApi } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const MONTH_OPTIONS = (() => {
    const opts = [{ label: 'All months', value: '' }];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        opts.push({
            label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        });
    }
    return opts;
})();

// Convert month string or date range to fromDate/toDate pair
function resolveRange({ month, fromDate, toDate }) {
    if (month) {
        const [y, m] = month.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return {
            fromDate: `${month}-01`,
            toDate: `${month}-${String(lastDay).padStart(2, '0')}`,
        };
    }
    return { fromDate, toDate };
}

export default function ReportReceiptPage() {
    const [data, setData]               = useState([]);
    const [loading, setLoading]         = useState(false);
    const [exporting, setExporting]     = useState(false);
    const [page, setPage]               = useState(0);
    const [totalPages, setTotalPages]   = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // UI state (what user is typing)
    const [filters, setFilters] = useState({ month: '', fromDate: '', toDate: '' });
    // Applied state (what was last searched)
    const [applied, setApplied] = useState({ month: '', fromDate: '', toDate: '' });

    // Directly compute params from applied state — no nested callback
    const getApiParams = (p = 0, size = 15) => {
        const { fromDate, toDate } = resolveRange(applied);
        const params = { page: p, size };
        if (fromDate) params.fromDate = fromDate;
        if (toDate)   params.toDate   = toDate;
        return params;
    };

    const fetchPage = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const { fromDate, toDate } = resolveRange(applied);
            const params = { page: p, size: 15 };
            if (fromDate) params.fromDate = fromDate;
            if (toDate)   params.toDate   = toDate;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applied]);

    useEffect(() => { fetchPage(0); }, [fetchPage]);

    const handleSearch = () => setApplied({ ...filters });
    const handleClear  = () => {
        const empty = { month: '', fromDate: '', toDate: '' };
        setFilters(empty);
        setApplied(empty);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const { fromDate, toDate } = resolveRange(applied);
            const params = { page: 0, size: 10000 };
            if (fromDate) params.fromDate = fromDate;
            if (toDate)   params.toDate   = toDate;
            const res = await reportApi.getReceipts(params);
            const rows = (res.data.content || []).map((r) => ({
                'Receipt No.':        r.receiptNumber || '',
                'Vendor':             r.vendorName || '',
                'Receipt Date':       r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-US') : '',
                'Status':             r.status || '',
                'Total Amount (VND)': r.totalAmount != null ? Number(r.totalAmount) : '',
                'Approved By':        r.approvedByName || '',
                'Notes':              r.notes || '',
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 30 }];
            const total = rows.reduce((s, r) => s + (Number(r['Total Amount (VND)']) || 0), 0);
            XLSX.utils.sheet_add_aoa(ws, [['', '', '', 'TOTAL', total, '', '']], { origin: -1 });

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Receipt Report');
            XLSX.writeFile(wb, `receipt_report_${applied.month || new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success(`Exported ${rows.length} receipts`);
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const columns = [
        { key: 'receiptNumber', label: 'Receipt No.', width: '130px' },
        { key: 'vendorName', label: 'Vendor' },
        {
            key: 'receiptDate', label: 'Date', width: '120px',
            render: (v) => v ? new Date(v).toLocaleDateString('en-US') : '—',
        },
        { key: 'status', label: 'Status', width: '110px', render: (v) => <StatusBadge status={v} /> },
        {
            key: 'totalAmount', label: 'Total Amount', width: '150px',
            render: (v) => v != null
                ? <span className="font-semibold">{Number(v).toLocaleString('vi-VN')}₫</span>
                : '—',
        },
        { key: 'approvedByName', label: 'Approved By', width: '130px' },
    ];

    const grandTotal = data.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);

    return (
        <div>
            <PageHeader title="Goods Receipt Report" subtitle={`${totalElements} approved receipts`}>
                <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-1.5">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
            </PageHeader>

            {/* Filters */}
            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Month picker */}
                        <div>
                            <label className="label">Month</label>
                            <select value={filters.month}
                                onChange={(e) => setFilters({ month: e.target.value, fromDate: '', toDate: '' })}
                                className="input w-44">
                                {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="text-slate-300 self-end pb-2">or</div>
                        <div>
                            <label className="label">From Date</label>
                            <input type="date" value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value, month: '' })}
                                className="input w-40" />
                        </div>
                        <div>
                            <label className="label">To Date</label>
                            <input type="date" value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value, month: '' })}
                                className="input w-40" />
                        </div>
                        <button onClick={handleSearch} className="btn-primary btn-sm h-9">View Report</button>
                        <button onClick={handleClear}  className="btn-secondary btn-sm h-9">Clear</button>
                    </div>
                </div>
            </div>

            {/* Page total */}
            {data.length > 0 && (
                <div className="card card-body mb-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Total on this page {applied.month ? `(${applied.month})` : ''}
                    </span>
                    <span className="text-lg font-bold text-primary-600">
                        {grandTotal.toLocaleString('vi-VN')}₫
                    </span>
                </div>
            )}

            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetchPage} />
                </div>
            </div>
        </div>
    );
}
