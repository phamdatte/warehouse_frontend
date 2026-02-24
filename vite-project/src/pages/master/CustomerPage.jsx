import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterApi } from '../../api/masterApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';

function CustomerModal({ customer, onSave, onClose }) {
    const [form, setForm] = useState(customer || { customerName: '', contactName: '', phone: '', email: '', address: '' });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try { await onSave(form); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">{customer?.customerId ? 'Sửa khách hàng' : 'Thêm khách hàng'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {[['customerName', 'Tên khách hàng *', true], ['contactName', 'Người liên hệ', false], ['phone', 'Điện thoại', false], ['email', 'Email', false], ['address', 'Địa chỉ', false]].map(([name, label, req]) => (
                        <div key={name}>
                            <label className="label">{label}</label>
                            <input name={name} value={form[name] || ''} onChange={handleChange} className="input" required={req} />
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Đang lưu...' : 'Lưu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CustomerPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await masterApi.getCustomers({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0); setTotalElements(res.data.totalElements || 0); setPage(p);
        } catch { toast.error('Không thể tải'); } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetch(0); }, [fetch]);

    const handleSave = async (form) => {
        try {
            if (modal !== 'create') await masterApi.updateCustomer(modal.customerId, form);
            else await masterApi.createCustomer(form);
            toast.success('Lưu thành công!'); setModal(null); fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Lưu thất bại'); }
    };
    const handleDelete = async () => {
        try { await masterApi.deleteCustomer(deleteTarget.customerId); toast.success('Xóa thành công!'); setDeleteTarget(null); fetch(page); }
        catch (err) { toast.error(err.response?.data?.message || 'Xóa thất bại'); }
    };

    const columns = [
        { key: 'customerName', label: 'Tên khách hàng' },
        { key: 'contactName', label: 'Người liên hệ', width: '150px' },
        { key: 'phone', label: 'SĐT', width: '120px' },
        { key: 'email', label: 'Email', width: '180px' },
        {
            key: 'action', label: '', width: '100px',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={() => setModal(row)} className="text-primary-500 text-xs font-medium">Sửa</button>
                    <button onClick={() => setDeleteTarget(row)} className="text-red-500 text-xs font-medium">Xóa</button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="Khách hàng" subtitle={`${totalElements} khách hàng`}>
                <button onClick={() => setModal('create')} className="btn-primary">+ Thêm</button>
            </PageHeader>
            <div className="card"><div className="card-body p-0">
                <DataTable columns={columns} data={data} loading={loading}
                    pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
            </div></div>
            {modal && <CustomerModal customer={modal !== 'create' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
            <ConfirmModal isOpen={!!deleteTarget} title="Xóa khách hàng" message={`Xóa khách hàng "${deleteTarget?.customerName}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        </div>
    );
}
