import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterApi } from '../../api/masterApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';

function VendorModal({ vendor, onSave, onClose }) {
    const [form, setForm] = useState(vendor || { vendorName: '', contactPerson: '', phone: '', email: '', address: '' });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try { await onSave(form); }
        finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">{vendor?.vendorId ? 'Edit Vendor' : 'Add Vendor'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {[['vendorName', 'Vendor Name *', true], ['contactPerson', 'Contact Person', false], ['phone', 'Phone', false], ['email', 'Email', false], ['address', 'Address', false]].map(([name, label, req]) => (
                        <div key={name}>
                            <label className="label">{label}</label>
                            <input name={name} value={form[name] || ''} onChange={handleChange} className="input" required={req} />
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function VendorPage() {
    const { isManager } = useAuth();
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
            const res = await masterApi.getVendors({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0); setTotalElements(res.data.totalElements || 0); setPage(p);
        } catch { toast.error('Failed to load'); } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetch(0); }, [fetch]);

    const handleSave = async (form) => {
        try {
            if (modal !== 'create') await masterApi.updateVendor(modal.vendorId, form);
            else await masterApi.createVendor(form);
            toast.success('Saved successfully!'); setModal(null); fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    };
    const handleDelete = async () => {
        try { await masterApi.deleteVendor(deleteTarget.vendorId); toast.success('Deleted successfully!'); setDeleteTarget(null); fetch(page); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    };
    const handleToggle = async (row) => {
        try {
            await masterApi.toggleVendor(row.vendorId);
            toast.success(`Vendor "${row.vendorName}" ${row.isActive ? 'deactivated' : 'activated'}!`);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    };

    const columns = [
        { key: 'vendorName', label: 'Vendor Name' },
        { key: 'contactPerson', label: 'Contact Person', width: '150px' },
        { key: 'phone', label: 'Phone', width: '120px' },
        { key: 'email', label: 'Email', width: '180px' },
        {
            key: 'isActive', label: 'Status', width: '90px',
            render: (v) => (
                <span className={`badge ${v ? 'badge-completed' : 'badge-cancelled'}`}>
                    {v ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        ...(isManager() ? [{
            key: 'action', label: '', width: '140px',
            render: (_, row) => (
                <div className="flex gap-3">
                    <button onClick={() => setModal(row)} className="text-primary-500 text-xs font-medium">Edit</button>
                    <button
                        onClick={() => handleToggle(row)}
                        className={`text-xs font-medium ${row.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                    >
                        {row.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => setDeleteTarget(row)} className="text-slate-400 hover:text-red-500 text-xs font-medium">Delete</button>
                </div>
            ),
        }] : []),
    ];

    return (
        <div>
            <PageHeader title="Vendors" subtitle={`${totalElements} vendors`}>
                {isManager() && <button onClick={() => setModal('create')} className="btn-primary">+ Add</button>}
            </PageHeader>
            <div className="card"><div className="card-body p-0">
                <DataTable columns={columns} data={data} loading={loading}
                    pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
            </div></div>
            {modal && <VendorModal vendor={modal !== 'create' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
            <ConfirmModal isOpen={!!deleteTarget} title="Delete vendor" message={`Are you sure you want to delete vendor "${deleteTarget?.vendorName}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        </div>
    );
}
