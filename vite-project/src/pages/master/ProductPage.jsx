import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterApi } from '../../api/masterApi';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';

function ProductModal({ product, categories, onSave, onClose }) {
    const [form, setForm] = useState(product ? {
        productName: product.productName || '',
        productCode: product.productCode || '',
        categoryId: product.category?.categoryId || '',
        unit: product.unit || '',
        unitPrice: product.unitPrice || '',
        description: product.description || '',
    } : { productName: '', productCode: '', categoryId: '', unit: '', unitPrice: '', description: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product?.productId) {
                await masterApi.updateProduct(product.productId, form);
                toast.success('Product updated successfully!');
            } else {
                await masterApi.createProduct(form);
                toast.success('Product added successfully!');
            }
            onSave();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">{product?.productId ? 'Edit Product' : 'Add Product'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Product Name *</label>
                            <input name="productName" value={form.productName} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Product Code</label>
                            <input name="productCode" value={form.productCode} onChange={handleChange} className="input" 
                                disabled={!product?.productId} 
                                placeholder={!product?.productId ? '(Auto-generated)' : ''} 
                            />
                        </div>
                        <div>
                            <label className="label">Category</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input">
                                <option value="">-- Select --</option>
                                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Unit</label>
                            <input name="unit" value={form.unit} onChange={handleChange} className="input" placeholder="Pieces, Boxes, Reams..." />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Unit Price (VND)</label>
                            <input name="unitPrice" type="number" min="0" value={form.unitPrice} onChange={handleChange} className="input" />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={2} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProductPage() {
    const { isManager } = useAuth();
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        masterApi.getCategories({ size: 100 }).then((r) => setCategories(r.data.content || []));
    }, []);

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await masterApi.getProducts({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(0); }, [fetch]);

    const handleDelete = async () => {
        try {
            await masterApi.deleteProduct(deleteTarget.productId);
            toast.success('Product deleted successfully!');
            setDeleteTarget(null);
            fetch(page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleToggle = async (row) => {
        try {
            await masterApi.toggleProduct(row.productId);
            toast.success(`Product "${row.productName}" ${row.isActive ? 'deactivated' : 'activated'}!`);
            fetch(page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const columns = [
        { key: 'productCode', label: 'Code', width: '90px' },
        { key: 'productName', label: 'Product Name' },
        {
            key: 'category', label: 'Category', width: '130px',
            render: (v) => v?.categoryName || '—',
        },
        { key: 'unit', label: 'Unit', width: '70px' },
        {
            key: 'unitPrice', label: 'Unit Price', width: '120px',
            render: (v) => v ? `${Number(v).toLocaleString('vi-VN')}₫` : '—'
        },
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
                    <button onClick={() => setModal(row)} className="text-primary-500 hover:text-primary-700 text-xs font-medium">Edit</button>
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
            <PageHeader title="Product Management" subtitle={`${totalElements} products`}>
                {isManager() && <button onClick={() => setModal('create')} className="btn-primary">+ Add Product</button>}
            </PageHeader>
            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
                </div>
            </div>
            {modal && (
                <ProductModal
                    product={modal === 'create' ? null : modal}
                    categories={categories}
                    onSave={() => { setModal(null); fetch(page); }}
                    onClose={() => setModal(null)}
                />
            )}
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Product"
                message={`Are you sure you want to delete product "${deleteTarget?.productName}"?`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
