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

function useCrud({ getAll, create, update, delete: del, idKey, getFields }) {
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
            const res = await getAll({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, [getAll]);

    useEffect(() => { fetch(0); }, [fetch]);

    const handleSave = async (form) => {
        try {
            if (modal !== 'create') await update(modal[idKey], form);
            else await create(form);
            toast.success('Saved successfully!');
            setModal(null);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    };

    const handleDelete = async () => {
        try {
            await del(deleteTarget[idKey]);
            toast.success('Deleted successfully!');
            setDeleteTarget(null);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    };

    return { data, loading, page, totalPages, totalElements, fetch, modal, setModal, deleteTarget, setDeleteTarget, handleSave, handleDelete };
}

// ---- CategoryPage ----
export function CategoryPage() {
    const { isManager } = useAuth();
    const FIELDS = [
        { name: 'categoryName', label: 'Category Name', required: true },
        { name: 'description', label: 'Description' },
    ];
    const crud = useCrud({
        getAll: masterApi.getCategories, create: masterApi.createCategory,
        update: masterApi.updateCategory, delete: masterApi.deleteCategory, idKey: 'categoryId',
    });
    const columns = [
        { key: 'categoryName', label: 'Category Name' },
        { key: 'description', label: 'Description' },
        ...(isManager() ? [{
            key: 'action', label: '', width: '100px',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={() => crud.setModal(row)} className="text-primary-500 text-xs font-medium">Edit</button>
                    <button onClick={() => crud.setDeleteTarget(row)} className="text-red-500 text-xs font-medium">Delete</button>
                </div>
            ),
        }] : []),
    ];
    return (
        <div>
            <PageHeader title="Product Categories" subtitle={`${crud.totalElements} categories`}>
                {isManager() && <button onClick={() => crud.setModal('create')} className="btn-primary">+ Add</button>}
            </PageHeader>
            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={crud.data} loading={crud.loading}
                        pagination={{ page: crud.page, totalPages: crud.totalPages, totalElements: crud.totalElements }} onPageChange={crud.fetch} />
                </div>
            </div>
            {crud.modal && <SimpleModal title={crud.modal === 'create' ? 'Add Category' : 'Edit Category'} fields={FIELDS} data={crud.modal !== 'create' ? crud.modal : null} onSave={crud.handleSave} onClose={() => crud.setModal(null)} />}
            <ConfirmModal isOpen={!!crud.deleteTarget} title="Delete category" message={`Are you sure you want to delete category "${crud.deleteTarget?.categoryName}"?`} onConfirm={crud.handleDelete} onCancel={() => crud.setDeleteTarget(null)} />
        </div>
    );
}
export default CategoryPage;
