import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { inventoryApi } from '../../api/inventoryApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const TYPE_OPTIONS = ['', 'Receipt', 'Issue'];

// Generate last 24 months for picker
const MONTH_OPTIONS = (() => {
    const opts = [{ label: 'All months', value: '' }];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        opts.push({ label, value });
    }
    return opts;
})();

// ── Transaction Detail Modal ─────────────────────────────────────────────────
function TransactionDetailModal({ tx, onClose }) {
    if (!tx) return null;
    const isReceipt = tx.transactionType === 'Receipt';
    const qtySign = isReceipt ? '+' : '-';
    const qtyColor = isReceipt ? 'text-green-600' : 'text-red-600';
    const bgColor = isReceipt ? 'bg-green-50' : 'bg-red-50';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className={`${bgColor} px-6 py-4 flex items-center justify-between border-b`}>
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Transaction Detail</div>
                        <h2 className="text-lg font-bold text-slate-800 mt-0.5">
                            {isReceipt ? '📥 Receipt' : '📤 Issue'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Qty highlight */}
                    <div className="flex items-center justify-center py-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className={`text-4xl font-extrabold tracking-tight ${qtyColor}`}>
                            {qtySign}{Number(tx.quantity).toLocaleString('en-US')}
                        </span>
                        {tx.unit && <span className="ml-2 text-lg text-slate-400 font-medium">{tx.unit}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <Field label="Product" value={tx.productName} />
                        <Field label="Reference No." value={tx.referenceNumber || '—'} />
                        <Field label="Date" value={tx.transactionDate ? new Date(tx.transactionDate).toLocaleString('en-US') : '—'} />
                        <Field label="Performed By" value={tx.performedBy || '—'} />
                        <Field label="Qty Before" value={tx.quantityBefore != null ? Number(tx.quantityBefore).toLocaleString('en-US') : '—'} />
                        <Field label="Qty After" value={tx.quantityAfter != null ? Number(tx.quantityAfter).toLocaleString('en-US') : '—'} />
                        {tx.unitPrice != null && <Field label="Unit Price (VND)" value={Number(tx.unitPrice).toLocaleString('vi-VN') + '₫'} />}
                        {tx.totalAmount != null && (
                            <Field label="Total Amount (VND)" value={Number(tx.totalAmount).toLocaleString('vi-VN') + '₫'} highlight />
                        )}
                        {tx.notes && <div className="col-span-2"><Field label="Notes" value={tx.notes} /></div>}
                    </div>
                </div>

                <div className="px-6 pb-5">
                    <button onClick={onClose} className="btn-secondary w-full">Close</button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, highlight }) {
    return (
        <div className={`rounded-lg px-3 py-2 ${highlight ? 'bg-primary-50 border border-primary-100' : 'bg-slate-50'}`}>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
            <div className={`font-semibold ${highlight ? 'text-primary-700' : 'text-slate-700'} text-sm`}>{value}</div>
        </div>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function monthToRange(monthStr) {
    if (!monthStr) return { from: null, to: null };
    const [y, m] = monthStr.split('-').map(Number);
    const from = new Date(y, m - 1, 1, 0, 0, 0);
    const to   = new Date(y, m, 0, 23, 59, 59); // last day of month
    return {
        from: from.toISOString().slice(0, 19),
        to:   to.toISOString().slice(0, 19),
    };
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TransactionHistoryPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({ type: '', month: '', fromDate: '', toDate: '' });
    const [selected, setSelected] = useState(null);
    const [exporting, setExporting] = useState(false);

    const buildApiParams = useCallback((p = 0, size = 15) => {
        const params = { page: p, size };

        if (filters.type) params.type = filters.type;

        // Month picker takes priority over manual date range
        if (filters.month) {
            const { from, to } = monthToRange(filters.month);
            if (from) params.from = from;
            if (to)   params.to   = to;
        } else {
            // Manual date range → convert YYYY-MM-DD to ISO datetime
            if (filters.fromDate) params.from = filters.fromDate + 'T00:00:00';
            if (filters.toDate)   params.to   = filters.toDate   + 'T23:59:59';
        }

        return params;
    }, [filters]);

    const fetchPage = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await inventoryApi.getTransactions(buildApiParams(p, 15));
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch {
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    }, [buildApiParams]);

    useEffect(() => { fetchPage(0); }, [fetchPage]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await inventoryApi.getTransactions(buildApiParams(0, 10000));
            const rows = (res.data.content || []).map((tx) => ({
                'Date':              tx.transactionDate ? new Date(tx.transactionDate).toLocaleString('en-US') : '',
                'Product':           tx.productName || '',
                'Unit':              tx.unit || '',
                'Type':              tx.transactionType || '',
                'Qty Change':        (tx.transactionType === 'Receipt' ? '+' : '-') + Number(tx.quantity),
                'Qty Before':        tx.quantityBefore != null ? Number(tx.quantityBefore) : '',
                'Qty After':         tx.quantityAfter  != null ? Number(tx.quantityAfter)  : '',
                'Unit Price (VND)':  tx.unitPrice   != null ? Number(tx.unitPrice)   : '',
                'Total Amount (VND)':tx.totalAmount != null ? Number(tx.totalAmount) : '',
                'Reference No.':     tx.referenceNumber || '',
                'Performed By':      tx.performedBy || '',
                'Notes':             tx.notes || '',
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [
                { wch: 20 }, { wch: 25 }, { wch: 8  }, { wch: 10 },
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
                { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 30 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
            const label = filters.month || new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `transaction_history_${label}.xlsx`);
            toast.success(`Exported ${rows.length} transactions`);
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const columns = [
        {
            key: 'transactionDate', label: 'Date', width: '160px',
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
                    {row.transactionType === 'Receipt' ? '+' : '-'}{Number(v).toLocaleString('en-US')}
                </span>
            ),
        },
        {
            key: 'totalAmount', label: 'Amount', width: '130px',
            render: (v) => v != null ? <span className="font-medium">{Number(v).toLocaleString('vi-VN')}₫</span> : '—',
        },
        { key: 'referenceNumber', label: 'Ref No.', width: '150px' },
        { key: 'performedBy',     label: 'Performed By', width: '130px' },
    ];

    return (
        <div>
            <PageHeader title="Transaction History" subtitle={`${totalElements} transactions`}>
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
                            <select
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value, fromDate: '', toDate: '' })}
                                className="input w-44"
                            >
                                {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        <div className="text-slate-300 self-end pb-2">or</div>

                        {/* Manual date range */}
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

                        {/* Type */}
                        <div>
                            <label className="label">Type</label>
                            <select value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input w-32">
                                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t || 'All'}</option>)}
                            </select>
                        </div>

                        <button onClick={() => fetchPage(0)} className="btn-primary btn-sm h-9">Search</button>
                        <button onClick={() => setFilters({ type: '', month: '', fromDate: '', toDate: '' })} className="btn-secondary btn-sm h-9">Clear</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body p-0">
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={loading}
                        pagination={{ page, totalPages, totalElements }}
                        onPageChange={fetchPage}
                        onRowClick={(row) => setSelected(row)}
                        rowClassName="cursor-pointer hover:bg-primary-50 transition"
                    />
                </div>
            </div>

            <TransactionDetailModal tx={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
