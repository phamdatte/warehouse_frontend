import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { receiptApi } from '../../api/receiptApi';
import { masterApi } from '../../api/masterApi';
import PageHeader from '../../components/PageHeader';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const emptyItem = { productId: '', quantity: '', unitPrice: '' };

export default function ReceiptEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [form, setForm] = useState({ vendorId: '', receiptDate: '', notes: '' });
    const [items, setItems] = useState([{ ...emptyItem }]);

    useEffect(() => {
        Promise.all([
            masterApi.getVendors({ size: 100 }),
            masterApi.getProducts({ size: 200 }),
            receiptApi.getById(id),
        ]).then(([v, p, r]) => {
            setVendors(v.data.content || []);
            setProducts(p.data.content || []);
            const receipt = r.data;
            if (receipt.status !== 'Pending') {
                toast.error('Only receipts with Pending status can be edited');
                navigate(`/receipt/${id}`);
                return;
            }
            setForm({
                vendorId: String(receipt.vendorId || ''),
                receiptDate: receipt.receiptDate ? receipt.receiptDate.slice(0, 16) : '',
                notes: receipt.notes || '',
            });
            setItems(receipt.items?.map(it => ({
                productId: String(it.productId),
                quantity: String(it.quantity),
                unitPrice: String(it.unitPrice),
            })) || [{ ...emptyItem }]);
        }).catch(() => toast.error('Failed to load data'))
            .finally(() => setInitialLoading(false));
    }, [id]);

    const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'productId') {
            const prod = products.find((p) => String(p.productId) === value);
            if (prod) newItems[index].unitPrice = String(prod.unitPrice);
        }
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { ...emptyItem }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

    const totalAmount = items.reduce((sum, it) =>
        sum + (parseFloat(it.quantity || 0) * parseFloat(it.unitPrice || 0)), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.vendorId) { toast.warning('Please select a vendor'); return; }
        if (items.some((it) => !it.productId || !it.quantity || !it.unitPrice)) {
            toast.warning('Please fill in all product details'); return;
        }
        setLoading(true);
        try {
            await receiptApi.update(id, {
                vendorId: Number(form.vendorId),
                receiptDate: form.receiptDate,
                notes: form.notes,
                items: items.map((it) => ({
                    productId: Number(it.productId),
                    quantity: Number(it.quantity),
                    unitPrice: Number(it.unitPrice),
                })),
            });
            toast.success('Receipt updated successfully!');
            navigate(`/receipt/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update receipt');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div>
            <PageHeader title="Edit Goods Receipt" subtitle="Edit receipt information (only when Pending)">
                <button onClick={() => navigate(`/receipt/${id}`)} className="btn-secondary">← Back</button>
            </PageHeader>

            <form onSubmit={handleSubmit}>
                <div className="card mb-6">
                    <div className="card-header">
                        <h3 className="font-semibold text-slate-700">General Information</h3>
                    </div>
                    <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Vendor *</label>
                            <select name="vendorId" value={form.vendorId} onChange={handleFormChange} className="input" required>
                                <option value="">-- Select vendor --</option>
                                {vendors.map((v) => (
                                    <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Receipt Date *</label>
                            <input type="datetime-local" name="receiptDate" value={form.receiptDate} onChange={handleFormChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Notes</label>
                            <input type="text" name="notes" value={form.notes} onChange={handleFormChange} className="input" placeholder="Enter notes..." />
                        </div>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-header">
                        <h3 className="font-semibold text-slate-700">Product List</h3>
                        <button type="button" onClick={addItem} className="btn-secondary btn-sm">
                            <PlusIcon className="w-4 h-4" /> Add Item
                        </button>
                    </div>
                    <div className="card-body p-0">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th className="w-32">Qty</th>
                                    <th className="w-40">Unit Price (VND)</th>
                                    <th className="w-40 text-right">Subtotal</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, i) => {
                                    const sub = parseFloat(it.quantity || 0) * parseFloat(it.unitPrice || 0);
                                    return (
                                        <tr key={i}>
                                            <td className="text-slate-400">{i + 1}</td>
                                            <td>
                                                <select value={it.productId} onChange={(e) => handleItemChange(i, 'productId', e.target.value)} className="input" required>
                                                    <option value="">-- Select product --</option>
                                                    {products.map((p) => (
                                                        <option key={p.productId} value={p.productId}>{p.productName} ({p.unit})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input type="number" min="0.01" step="0.01" value={it.quantity}
                                                    onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                                                    className="input" placeholder="0" required />
                                            </td>
                                            <td>
                                                <input type="number" min="0" step="1" value={it.unitPrice}
                                                    onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
                                                    className="input" placeholder="0" required />
                                            </td>
                                            <td className="text-right font-medium text-slate-700">
                                                {sub.toLocaleString('en-US')}₫
                                            </td>
                                            <td>
                                                {items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">Total:</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary-600 text-base">
                                        {totalAmount.toLocaleString('en-US')}₫
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate(`/receipt/${id}`)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
