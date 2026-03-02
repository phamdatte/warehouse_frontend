import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterApi } from '../../api/masterApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';

function SimpleModal({ title, fields, data, onSave, onClose }) {
    const [form, setForm] = useState(data || {});
    const [loading, setLoading] = useState(false);
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
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {fields.map((f) => (
                        <div key={f.name}>
                            <label className="label">{f.label}{f.required && ' *'}</label>
                            <input name={f.name} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className="input" required={f.required} />
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

// ---- CategoryPage ----
export function CategoryPage() {
    const { isManager } = useAuth();
    const FIELDS = [
        { name: 'categoryName', label: 'Category Name', required: true },
        { name: 'description', label: 'Description' },
    ];
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
            const res = await masterApi.getCategories({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch { toast.error('Failed to load categories'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(0); }, [fetch]);

    const handleSave = async (form) => {
        try {
            if (modal !== 'create') await masterApi.updateCategory(modal.categoryId, form);
            else await masterApi.createCategory(form);
            toast.success('Saved successfully!');
            setModal(null);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    };

    const handleDelete = async () => {
        try {
            await masterApi.deleteCategory(deleteTarget.categoryId);
            toast.success('Deleted successfully!');
            setDeleteTarget(null);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    };

    const handleToggle = async (row) => {
        try {
            await masterApi.toggleCategory(row.categoryId);
            toast.success(`Category "${row.categoryName}" ${row.isActive ? 'deactivated' : 'activated'}!`);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    };

    const columns = [
        { key: 'categoryName', label: 'Category Name' },
        { key: 'description', label: 'Description' },
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
            <PageHeader title="Product Categories" subtitle={`${totalElements} categories`}>
                {isManager() && <button onClick={() => setModal('create')} className="btn-primary">+ Add</button>}
            </PageHeader>
            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
                </div>
            </div>
            {modal && <SimpleModal title={modal === 'create' ? 'Add Category' : 'Edit Category'} fields={FIELDS} data={modal !== 'create' ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
            <ConfirmModal isOpen={!!deleteTarget} title="Delete category" message={`Are you sure you want to delete category "${deleteTarget?.categoryName}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        </div>
    );
}
export default CategoryPage;
