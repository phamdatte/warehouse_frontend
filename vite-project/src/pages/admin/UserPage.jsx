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
                <h3 className="text-lg font-semibold mb-4">Add User</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Username *</label>
                            <input name="username" value={form.username} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Password *</label>
                            <input name="password" type="password" value={form.password} onChange={handleChange} className="input" required />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Full Name *</label>
                            <input name="fullName" value={form.fullName} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            <input name="phone" value={form.phone} onChange={handleChange} className="input" />
                        </div>
                        <div className="col-span-2">
                            <label className="label">Role</label>
                            <select name="roleId" value={form.roleId} onChange={handleChange} className="input">
                                <option value={1}>Admin</option>
                                <option value={2}>Manager</option>
                                <option value={3}>Staff</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Account'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ChangeRoleModal({ user, roles, onSave, onClose }) {
    const [roleId, setRoleId] = useState(user.roleId);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try { await onSave(roleId); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
                <h3 className="text-lg font-semibold mb-1">Change Role</h3>
                <p className="text-sm text-slate-500 mb-4">{user.fullName} ({user.username})</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">New Role</label>
                        <select value={roleId} onChange={e => setRoleId(Number(e.target.value))} className="input">
                            {roles.map(r => (
                                <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserPage() {
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [changeRoleTarget, setChangeRoleTarget] = useState(null); // user object

    const fetch = useCallback(async (p = 0) => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers({ page: p, size: 15 });
            setData(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            setTotalElements(res.data.totalElements || 0);
            setPage(p);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetch(0);
        // Load available roles for the change-role modal
        adminApi.getRoles().then(res => setRoles(res.data || [])).catch(() => { });
    }, [fetch]);

    const handleCreate = async (form) => {
        try {
            await adminApi.createUser({ ...form, roleId: Number(form.roleId) });
            toast.success('Account created successfully!');
            setShowCreate(false);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create account'); }
    };

    const handleToggle = async (user) => {
        try {
            await adminApi.toggleActive(user.userId);
            toast.success(`Account ${user.isActive ? 'locked' : 'unlocked'} successfully!`);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    };

    const handleChangeRole = async (roleId) => {
        try {
            await adminApi.changeRole(changeRoleTarget.userId, roleId);
            toast.success(`Role updated for ${changeRoleTarget.fullName}!`);
            setChangeRoleTarget(null);
            fetch(page);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to change role'); }
    };

    const columns = [
        { key: 'username', label: 'Username', width: '140px' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email', width: '180px' },
        {
            key: 'roleName', label: 'Role', width: '120px',
            render: (v) => (
                <span className={`badge ${v === 'Admin' ? 'badge-approved' : v === 'Manager' ? 'badge-pending' : 'bg-slate-100 text-slate-600'}`}>{v}</span>
            ),
        },
        {
            key: 'isActive', label: 'Status', width: '110px',
            render: (v) => (
                <span className={`badge ${v ? 'badge-completed' : 'badge-cancelled'}`}>{v ? 'Active' : 'Locked'}</span>
            ),
        },
        {
            key: 'action', label: '', width: '150px',
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setChangeRoleTarget(row)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-800"
                    >
                        Change Role
                    </button>
                    <button
                        onClick={() => handleToggle(row)}
                        className={`text-xs font-medium ${row.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                    >
                        {row.isActive ? 'Lock' : 'Unlock'}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="User Management" subtitle={`${totalElements} accounts`}>
                <button onClick={() => setShowCreate(true)} className="btn-primary">+ Add User</button>
            </PageHeader>
            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={data} loading={loading}
                        pagination={{ page, totalPages, totalElements }} onPageChange={fetch} />
                </div>
            </div>
            {showCreate && <CreateUserModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
            {changeRoleTarget && (
                <ChangeRoleModal
                    user={changeRoleTarget}
                    roles={roles}
                    onSave={handleChangeRole}
                    onClose={() => setChangeRoleTarget(null)}
                />
            )}
        </div>
    );
}
