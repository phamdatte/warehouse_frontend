import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { receiptApi } from '../../api/receiptApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

export default function ReceiptDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchReceipt = () => {
        receiptApi.getById(id)
            .then((res) => setReceipt(res.data))
            .catch(() => toast.error('Receipt not found'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReceipt(); }, [id]);

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this receipt?')) return;
        setApproving(true);
        try {
            await receiptApi.approve(id);
            toast.success('Receipt approved successfully!');
            fetchReceipt();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to approve receipt');
        } finally {
            setApproving(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this receipt?')) return;
        setCancelling(true);
        try {
            await receiptApi.cancel(id);
            toast.success('Receipt cancelled successfully!');
            fetchReceipt();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to cancel receipt');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
    );
    if (!receipt) return <div className="text-center text-slate-400 py-20">Receipt not found</div>;

    const totalAmount = receipt.items?.reduce((s, it) => s + Number(it.subtotal || 0), 0) || 0;
    const isPending = receipt.status === 'Pending';

    return (
        <div>
            <PageHeader
                title={`Receipt: ${receipt.receiptNumber}`}
                subtitle={`Created: ${receipt.createdAt ? new Date(receipt.createdAt).toLocaleString('en-US') : '—'}`}
            >
                <button onClick={() => navigate('/receipt')} className="btn-secondary">← Back</button>
                {isPending && (
                    <button onClick={() => navigate(`/receipt/${id}/edit`)} className="btn-secondary">
                        ✏️ Edit
                    </button>
                )}
                {isPending && isManager() && (
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="btn-primary"
                    >
                        {approving ? 'Approving...' : '✅ Approve'}
                    </button>
                )}
                {isPending && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="btn-danger"
                    >
                        {cancelling ? 'Cancelling...' : '🚫 Cancel'}
                    </button>
                )}
            </PageHeader>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Vendor</div>
                    <div className="font-semibold text-slate-800">{receipt.vendorName || '—'}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Receipt Date</div>
                    <div className="font-semibold text-slate-800">
                        {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleString('en-US') : '—'}
                    </div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</div>
                    <StatusBadge status={receipt.status} />
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created By</div>
                    <div className="font-semibold">{receipt.createdByName || '—'}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Approved By</div>
                    <div className="font-semibold">{receipt.approvedByName || '—'}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</div>
                    <div className="text-slate-600 text-sm">{receipt.notes || '—'}</div>
                </div>
            </div>

            {/* Items table */}
            <div className="card mb-6">
                <div className="card-header">
                    <h3 className="font-semibold text-slate-700">Product Details</h3>
                    <span className="text-sm text-slate-500">{receipt.items?.length || 0} items</span>
                </div>
                <div className="card-body p-0">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Unit</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Unit Price</th>
                                <th className="text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipt.items?.map((it, i) => (
                                <tr key={it.receiptItemId || i}>
                                    <td className="text-slate-400">{i + 1}</td>
                                    <td>
                                        <div className="font-medium">{it.productName}</div>
                                        <div className="text-xs text-slate-400">{it.productCode}</div>
                                    </td>
                                    <td className="text-slate-500">{it.unit}</td>
                                    <td className="text-right">{Number(it.quantity).toLocaleString('en-US')}</td>
                                    <td className="text-right">{Number(it.unitPrice).toLocaleString('en-US')}₫</td>
                                    <td className="text-right font-semibold text-primary-600">
                                        {Number(it.subtotal).toLocaleString('en-US')}₫
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200 bg-slate-50">
                                <td colSpan={5} className="px-4 py-3 text-right font-bold text-slate-700">Total:</td>
                                <td className="px-4 py-3 text-right font-bold text-primary-700 text-lg">
                                    {totalAmount.toLocaleString('en-US')}₫
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
