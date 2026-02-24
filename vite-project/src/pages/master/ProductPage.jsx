import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { masterApi } from '../../api/masterApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';

function ProductModal({ product, categories, onSave, onClose }) {
    const [form, setForm] = useState(product || { productName: '', productCode: '', categoryId: '', unit: '', unitPrice: '', description: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product?.productId) {
                await masterApi.updateProduct(product.productId, form);
                toast.success('Cập nhật sản phẩm thành công!');
            } else {
                await masterApi.createProduct(form);
                toast.success('Thêm sản phẩm thành công!');
            }
            onSave();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">{product?.productId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Tên sản phẩm *</label>
                            <input name="productName" value={form.productName} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Mã sản phẩm</label>
                            <input name="productCode" value={form.productCode} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="label">Danh mục</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input">
                                <option value="">-- Chọn --</option>
                                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Đơn vị tính</label>
                            <input name="unit" value={form.unit} onChange={handleChange} className="input" placeholder="Cái, Hộp, Ram..." />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Đơn giá (VND)</label>
                            <input name="unitPrice" type="number" min="0" value={form.unitPrice} onChange={handleChange} className="input" />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Mô tả</label>
                            <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={2} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Đang lưu...' : 'Lưu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProductPage() {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [modal, setModal] = useState(null); // null | 'create' | product object
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
        } catch { toast.error('Không thể tải danh sách sản phẩm'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(0); }, [fetch]);

    const handleDelete = async () => {
        try {
            await masterApi.deleteProduct(deleteTarget.productId);
            toast.success('Xóa sản phẩm thành công!');
            setDeleteTarget(null);
            fetch(page);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xóa thất bại');
        }
    };

    const columns = [
        { key: 'productCode', label: 'Mã SP', width: '100px' },
        { key: 'productName', label: 'Tên sản phẩm' },
        { key: 'categoryName', label: 'Danh mục', width: '140px' },
        { key: 'unit', label: 'ĐVT', width: '80px' },
        {
            key: 'unitPrice', label: 'Đơn giá', width: '120px',
            render: (v) => v ? `${Number(v).toLocaleString('vi-VN')}₫` : '—'
        },
        {
            key: 'action', label: '', width: '100px',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={() => setModal(row)} className="text-primary-500 hover:text-primary-700 text-xs font-medium">Sửa</button>
                    <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700 text-xs font-medium">Xóa</button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="Quản lý sản phẩm" subtitle={`${totalElements} sản phẩm`}>
                <button onClick={() => setModal('create')} className="btn-primary">+ Thêm sản phẩm</button>
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
                title="Xóa sản phẩm"
                message={`Bạn chắc chắn muốn xóa sản phẩm "${deleteTarget?.productName}"?`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
