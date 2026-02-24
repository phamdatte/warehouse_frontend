import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { issueApi } from '../../api/issueApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';

export default function IssueDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approveModal, setApproveModal] = useState(false);
    const [approving, setApproving] = useState(false);

    const loadIssue = async () => {
        try {
            const res = await issueApi.getById(id);
            setIssue(res.data);
        } catch {
            toast.error('Không tìm thấy phiếu xuất');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadIssue(); }, [id]);

    const handleApprove = async () => {
        setApproving(true);
        try {
            await issueApi.approve(id);
            toast.success('Duyệt phiếu xuất thành công! Tồn kho đã được cập nhật.');
            setApproveModal(false);
            await loadIssue();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Duyệt phiếu thất bại');
        } finally {
            setApproving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
    );
    if (!issue) return <div className="text-center text-slate-400 py-20">Không tìm thấy phiếu</div>;

    const totalAmount = issue.items?.reduce((s, it) => s + (it.subtotal || 0), 0) || 0;

    return (
        <div>
            <PageHeader title={`Phiếu xuất: ${issue.issueNumber}`}>
                <button onClick={() => navigate('/issue')} className="btn-secondary">← Quay lại</button>
                {isManager() && issue.status === 'Pending' && (
                    <button onClick={() => setApproveModal(true)} className="btn-success">✓ Duyệt phiếu</button>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Khách hàng', value: issue.customerName },
                    { label: 'Ngày xuất', value: issue.issueDate ? new Date(issue.issueDate).toLocaleString('vi-VN') : '—' },
                    { label: 'Trạng thái', value: <StatusBadge status={issue.status} /> },
                    { label: 'Người tạo', value: issue.createdByName },
                    { label: 'Người duyệt', value: issue.approvedByName || '—' },
                    { label: 'Ghi chú', value: issue.notes || '—' },
                ].map(({ label, value }) => (
                    <div key={label} className="card card-body">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                        <div className="font-semibold text-slate-800">{value}</div>
                    </div>
                ))}
            </div>

            <div className="card mb-6">
                <div className="card-header">
                    <h3 className="font-semibold text-slate-700">Chi tiết sản phẩm</h3>
                    <span className="text-sm text-slate-500">{issue.items?.length || 0} mặt hàng</span>
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
                            {issue.items?.map((it, i) => (
                                <tr key={it.issueItemId || i}>
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
                title="Duyệt phiếu xuất"
                message={`Bạn xác nhận duyệt phiếu ${issue.issueNumber}? Tồn kho sẽ bị trừ sau khi duyệt.`}
                confirmLabel={approving ? 'Đang xử lý...' : 'Duyệt'}
                confirmClass="btn-success"
                onConfirm={handleApprove}
                onCancel={() => setApproveModal(false)}
            />
        </div>
    );
}
