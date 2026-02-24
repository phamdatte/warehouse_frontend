import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { receiptApi } from '../../api/receiptApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';

export default function ReceiptDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approveModal, setApproveModal] = useState(false);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        receiptApi.getById(id)
            .then((res) => setReceipt(res.data))
            .catch(() => toast.error('Không tìm thấy phiếu nhập'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleApprove = async () => {
        setApproving(true);
        try {
            await receiptApi.approve(id);
            toast.success('Duyệt phiếu nhập thành công! Tồn kho đã được cập nhật.');
            setApproveModal(false);
            // Refresh
            const res = await receiptApi.getById(id);
            setReceipt(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Duyệt phiếu thất bại');
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }
    if (!receipt) return <div className="text-center text-slate-400 py-20">Không tìm thấy phiếu</div>;

    const totalAmount = receipt.items?.reduce((s, it) => s + (it.subtotal || 0), 0) || 0;

    return (
        <div>
            <PageHeader title={`Phiếu nhập: ${receipt.receiptNumber}`} subtitle={`Trạng thái: `}>
                <button onClick={() => navigate('/receipt')} className="btn-secondary">← Quay lại</button>
                {isManager() && receipt.status === 'Pending' && (
                    <button onClick={() => setApproveModal(true)} className="btn-success">
                        ✓ Duyệt phiếu
                    </button>
                )}
            </PageHeader>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nhà cung cấp</div>
                    <div className="font-semibold text-slate-800">{receipt.vendorName || '—'}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ngày nhập</div>
                    <div className="font-semibold text-slate-800">
                        {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleString('vi-VN') : '—'}
                    </div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Trạng thái</div>
                    <StatusBadge status={receipt.status} />
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Người tạo</div>
                    <div className="font-semibold">{receipt.createdByName || '—'}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Người duyệt</div>
                    <div className="font-semibold">{receipt.approvedByName || '—'}</div>
                </div>
                <div className="card card-body">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ghi chú</div>
                    <div className="text-slate-600 text-sm">{receipt.notes || '—'}</div>
                </div>
            </div>

            {/* Items table */}
            <div className="card mb-6">
                <div className="card-header">
                    <h3 className="font-semibold text-slate-700">Chi tiết sản phẩm</h3>
                    <span className="text-sm text-slate-500">{receipt.items?.length || 0} mặt hàng</span>
                </div>
                <div className="card-body p-0">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Sản phẩm</th>
                                <th className="text-right">Số lượng</th>
                                <th className="text-right">Đơn giá</th>
                                <th className="text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipt.items?.map((it, i) => (
                                <tr key={it.receiptItemId || i}>
                                    <td className="text-slate-400">{i + 1}</td>
                                    <td className="font-medium">{it.productName}</td>
                                    <td className="text-right">{it.quantity?.toLocaleString('vi-VN')}</td>
                                    <td className="text-right">{it.unitPrice?.toLocaleString('vi-VN')}₫</td>
                                    <td className="text-right font-semibold text-primary-600">{it.subtotal?.toLocaleString('vi-VN')}₫</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200 bg-slate-50">
                                <td colSpan={4} className="px-4 py-3 text-right font-bold text-slate-700">Tổng cộng:</td>
                                <td className="px-4 py-3 text-right font-bold text-primary-700 text-lg">{totalAmount.toLocaleString('vi-VN')}₫</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={approveModal}
                title="Duyệt phiếu nhập"
                message={`Bạn xác nhận duyệt phiếu ${receipt.receiptNumber}? Tồn kho sẽ được cập nhật sau khi duyệt.`}
                confirmLabel={approving ? 'Đang xử lý...' : 'Duyệt'}
                confirmClass="btn-success"
                onConfirm={handleApprove}
                onCancel={() => setApproveModal(false)}
            />
        </div>
    );
}
