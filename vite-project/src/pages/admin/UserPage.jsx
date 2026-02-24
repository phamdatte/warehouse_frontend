import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/adminApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

function CreateUserModal({ onSave, onClose }) {
    const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', phone: '', roleId: 3 });
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
                <h3 className="text-lg font-semibold mb-4">Thêm người dùng</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Tên đăng nhập *</label>
                            <input name="username" value={form.username} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Mật khẩu *</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange} className="input" required />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Họ và tên *</label>
                            <input name="fullName" value={form.fullName} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="label">Điện thoại</label>
                            <input name="phone" value={form.phone} onChange={handleChange} className="input" />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Vai trò</label>
                            <select name="roleId" value={form.roleId} onChange={handleChange} className="input">
                                <option value={1}>Admin</option>
                                <option value={2}>Manager</option>
                                <option value={3}>Staff</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [showCreate, setShowCreate] = useState(false);

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch { toast.error('Không thể tải danh sách người dùng'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(0); }, [fetch]);

    const handleCreate = async (form) => {
        try {
            await adminApi.createUser({ ...form, roleId: Number(form.roleId) });
            toast.success('Tạo tài khoản thành công!');
            setShowCreate(false);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Tạo tài khoản thất bại'); }
    };

    const handleToggle = async (user) => {
        try {
            await adminApi.toggleActive(user.userId);
            toast.success(`${user.isActive ? 'Khóa' : 'Mở khóa'} tài khoản thành công!`);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại'); }
    };

    const columns = [
        { key: 'username', label: 'Tên đăng nhập', width: '140px' },
        { key: 'fullName', label: 'Họ và tên' },
        { key: 'email', label: 'Email', width: '180px' },
        {
            key: 'roleName', label: 'Vai trò', width: '100px',
            render: (v) => (
                <span className={`badge ${v === 'Admin' ? 'badge-approved' : v === 'Manager' ? 'badge-pending' : 'bg-slate-100 text-slate-600'}`}>{v}</span>
            ),
        },
        {
            key: 'isActive', label: 'Trạng thái', width: '110px',
            render: (v) => (
                <span className={`badge ${v ? 'badge-completed' : 'badge-cancelled'}`}>{v ? 'Hoạt động' : 'Đã khóa'}</span>
            ),
        },
        {
            key: 'action', label: '', width: '100px',
            render: (_, row) => (
                <button
                    onClick={() => handleToggle(row)}
                    className={`text-xs font-medium ${row.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                >
                    {row.isActive ? 'Khóa' : 'Mở khóa'}
                </button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="Quản lý người dùng" subtitle={`${totalElements} tài khoản`}>
                <button onClick={() => setShowCreate(true)} className="btn-primary">+ Thêm người dùng</button>
            </PageHeader>
            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
                </div>
            </div>
            {showCreate && <CreateUserModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
        </div>
    );
}
