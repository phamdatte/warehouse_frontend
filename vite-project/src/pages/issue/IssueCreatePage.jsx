import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { issueApi } from '../../api/issueApi';
import { masterApi } from '../../api/masterApi';
import { inventoryApi } from '../../api/inventoryApi';
import PageHeader from '../../components/PageHeader';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const emptyItem = { productId: '', quantity: '', unitPrice: '', availableStock: null };

export default function IssueCreatePage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        customerId: '',
        issueDate: new Date().toISOString().slice(0, 16),
        notes: '',
    });
    const [items, setItems] = useState([{ ...emptyItem }]);

    useEffect(() => {
        Promise.all([
            masterApi.getCustomers({ size: 100 }),
            masterApi.getProducts({ size: 200 }),
            inventoryApi.getAll({ size: 200 }),
        ]).then(([c, p, inv]) => {
            setCustomers(c.data.content || []);
            setProducts(p.data.content || []);
            setInventory(inv.data.content || []);
        }).catch(() => toast.error('Không thể tải dữ liệu'));
    }, []);

    const getStock = (productId) => {
        const inv = inventory.find((i) => String(i.productId) === String(productId));
        return inv ? inv.currentQuantity : 0;
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'productId') {
            const prod = products.find((p) => String(p.productId) === value);
            if (prod) newItems[index].unitPrice = prod.unitPrice;
            newItems[index].availableStock = getStock(value);
        }
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { ...emptyItem }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

    const totalAmount = items.reduce((s, it) => s + (parseFloat(it.quantity || 0) * parseFloat(it.unitPrice || 0)), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customerId) { toast.warning('Please select a customer'); return; }
        if (items.some((it) => !it.productId || !it.quantity || !it.unitPrice)) {
            toast.warning('Please fill in all product details'); return;
        }
        // Client-side stock check
        for (const it of items) {
            const stock = getStock(it.productId);
            if (parseFloat(it.quantity) > stock) {
                const prod = products.find((p) => String(p.productId) === String(it.productId));
                toast.error(`Insufficient stock for "${prod?.productName}" (only ${stock} left)`);
                return;
            }
        }
        setLoading(true);
        try {
            await issueApi.create({
                customerId: Number(form.customerId),
                issueDate: form.issueDate,
                notes: form.notes,
                items: items.map((it) => ({
                    productId: Number(it.productId),
                    quantity: Number(it.quantity),
                    unitPrice: Number(it.unitPrice),
                })),
            });
            toast.success('Issue created successfully!');
            navigate('/issue');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title="Create Goods Issue" subtitle="Issue goods to customer">
                <button onClick={() => navigate('/issue')} className="btn-secondary">← Back</button>
            </PageHeader>

            <form onSubmit={handleSubmit}>
                <div className="card mb-6">
                    <div className="card-header"><h3 className="font-semibold text-slate-700">General Information</h3></div>
                    <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Customer *</label>
                            <select name="customerId" value={form.customerId}
                                onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="input" required>
                                <option value="">-- Select customer --</option>
                                {customers.map((c) => <option key={c.customerId} value={c.customerId}>{c.customerName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Issue Date *</label>
                            <input type="datetime-local" value={form.issueDate}
                                onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="label">Notes</label>
                            <input type="text" value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Enter notes..." />
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
                                    <th className="w-32">Stock</th>
                                    <th className="w-32">Qty</th>
                                    <th className="w-40">Unit Price (VND)</th>
                                    <th className="w-40 text-right">Subtotal</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, i) => {
                                    const stock = it.productId ? getStock(it.productId) : null;
                                    const sub = parseFloat(it.quantity || 0) * parseFloat(it.unitPrice || 0);
                                    const overStock = stock !== null && parseFloat(it.quantity || 0) > stock;
                                    return (
                                        <tr key={i}>
                                            <td className="text-slate-400">{i + 1}</td>
                                            <td>
                                                <select value={it.productId}
                                                    onChange={(e) => handleItemChange(i, 'productId', e.target.value)} className="input" required>
                                                    <option value="">-- Select product --</option>
                                                    {products.map((p) => <option key={p.productId} value={p.productId}>{p.productName} ({p.unit})</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                {stock !== null ? (
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stock === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                                        {stock.toLocaleString('en-US')}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <input type="number" min="0.01" step="0.01" value={it.quantity}
                                                    onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                                                    className={`input ${overStock ? 'input-error' : ''}`} placeholder="0" required />
                                                {overStock && <div className="text-red-500 text-xs mt-0.5">Exceeds stock!</div>}
                                            </td>
                                            <td>
                                                <input type="number" min="0" step="1" value={it.unitPrice}
                                                    onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)} className="input" placeholder="0" required />
                                            </td>
                                            <td className="text-right font-medium text-slate-700">{sub.toLocaleString('en-US')}₫</td>
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
                                    <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-700">Total:</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary-600 text-base">{totalAmount.toLocaleString('en-US')}₫</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/issue')} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : 'Create Issue'}
                    </button>
                </div>
            </form>
        </div>
    );
}
