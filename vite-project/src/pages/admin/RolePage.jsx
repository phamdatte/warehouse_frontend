import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/adminApi';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

function RoleFormModal({ role, onSave, onClose }) {
    const isEdit = !!role;
    const [form, setForm] = useState({
        roleName: role?.roleName || '',
        description: role?.description || '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Role' : 'Add Role'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Role Name *</label>
                        <input
                            name="roleName"
                            value={form.roleName}
                            onChange={handleChange}
                            className="input"
                            required
                            placeholder="e.g. Supervisor"
                        />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="input resize-none"
                            rows={3}
                            placeholder="Describe the role's responsibilities..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function RolePage() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', role?: {} }

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminApi.getRoles();
            setRoles(res.data || []);
        } catch {
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const handleCreate = async (form) => {
        try {
            await adminApi.createRole(form);
            toast.success('Role created successfully!');
            setModal(null);
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create role');
        }
    };

    const handleUpdate = async (form) => {
        try {
            await adminApi.updateRole(modal.role.roleId, form);
            toast.success('Role updated successfully!');
            setModal(null);
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleToggle = async (role) => {
        try {
            await adminApi.toggleRole(role.roleId);
            toast.success(`Role "${role.roleName}" ${role.isActive ? 'deactivated' : 'activated'}!`);
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const SYSTEM_ROLES = ['Admin', 'Manager', 'Staff'];

    const columns = [
        {
            key: 'roleName', label: 'Role Name', width: '160px',
            render: (v) => (
                <span className="font-semibold text-slate-800">{v}</span>
            ),
        },
        { key: 'description', label: 'Description' },
        {
            key: 'isActive', label: 'Status', width: '100px',
            render: (v) => (
                <span className={`badge ${v ? 'badge-completed' : 'badge-cancelled'}`}>
                    {v ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'action', label: '', width: '140px',
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setModal({ mode: 'edit', role: row })}
                        disabled={SYSTEM_ROLES.includes(row.roleName)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={SYSTEM_ROLES.includes(row.roleName) ? 'System roles cannot be renamed' : 'Edit'}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleToggle(row)}
                        disabled={SYSTEM_ROLES.includes(row.roleName)}
                        className={`text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed ${row.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'
                            }`}
                        title={SYSTEM_ROLES.includes(row.roleName) ? 'System roles cannot be deactivated' : ''}
                    >
                        {row.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader title="Role Management" subtitle={`${roles.length} roles`}>
                <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">
                    + Add Role
                </button>
            </PageHeader>

            <div className="card">
                <div className="card-body p-0">
                    <DataTable columns={columns} data={roles} loading={loading} />
                </div>
            </div>

            {/* Info banner */}
            <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <strong>Note:</strong> System roles (Admin, Manager, Staff) cannot be renamed or deactivated.
                To change what pages each role can access, go to{' '}
                <a href="/admin/page-permission" className="underline font-medium">Page Permissions</a>.
            </div>

            {modal?.mode === 'create' && (
                <RoleFormModal onSave={handleCreate} onClose={() => setModal(null)} />
            )}
            {modal?.mode === 'edit' && (
                <RoleFormModal role={modal.role} onSave={handleUpdate} onClose={() => setModal(null)} />
            )}
        </div>
    );
}
