import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../api/adminApi';
import PageHeader from '../../components/PageHeader';

const PERM_COLS = [
    { key: 'canView', label: 'View' },
    { key: 'canCreate', label: 'Create' },
    { key: 'canEdit', label: 'Edit' },
    { key: 'canDelete', label: 'Delete' },
    { key: 'canApprove', label: 'Approve' },
];

const GROUP_LABELS = {
    dashboard: '🏠 Dashboard',
    receipt: '📥 Goods Receipt',
    issue: '📤 Goods Issue',
    inventory: '📦 Inventory',
    report: '📊 Reports',
    master: '⚙️ Master Data',
    admin: '👤 System Admin',
};

// English display names mapped from pageUrl
const PAGE_NAMES = {
    '/dashboard': 'Dashboard',
    '/receipt': 'Receipt List',
    '/receipt/create': 'Create Receipt',
    '/receipt/:id': 'Receipt Detail',
    '/receipt/approve': 'Approve Receipt',
    '/issue': 'Issue List',
    '/issue/create': 'Create Issue',
    '/issue/:id': 'Issue Detail',
    '/issue/approve': 'Approve Issue',
    '/inventory': 'Current Inventory',
    '/inventory/history': 'Transaction History',
    '/report/receipt': 'Receipt Report',
    '/report/issue': 'Issue Report',
    '/report/inventory': 'Inventory Report',
    '/product': 'Products',
    '/category': 'Categories',
    '/vendor': 'Vendors',
    '/customer': 'Customers',
    '/admin/user': 'User Management',
    '/admin/role': 'Role Management',
    '/admin/page-permission': 'Page Permissions',
};

export default function PagePermissionPage() {
    const [roles, setRoles] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [pages, setPages] = useState([]);  // UserPageResponse list for selected role
    const [perms, setPerms] = useState({});  // { pageId: { canView, canCreate, ... } }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load role list — exclude Admin (full access, no need to configure)
    useEffect(() => {
        adminApi.getRoles()
            .then(res => {
                const list = (res.data || []).filter(r => r.roleName !== 'Admin');
                setRoles(list);
                if (list.length > 0) setSelectedRoleId(String(list[0].roleId));
            })
            .catch(() => toast.error('Failed to load roles'));
    }, []);

    // Load page permissions when role changes
    const loadRolePages = useCallback(async (roleId) => {
        if (!roleId) return;
        setLoading(true);
        try {
            const res = await adminApi.getRolePages(roleId);
            const list = res.data || [];
            setPages(list);
            // Build perms map from response
            const map = {};
            list.forEach(p => {
                map[p.pageId] = {
                    canView: !!p.canView,
                    canCreate: !!p.canCreate,
                    canEdit: !!p.canEdit,
                    canDelete: !!p.canDelete,
                    canApprove: !!p.canApprove,
                };
            });
            setPerms(map);
        } catch {
            toast.error('Failed to load page permissions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedRoleId) loadRolePages(selectedRoleId);
    }, [selectedRoleId, loadRolePages]);

    const handleToggle = (pageId, permKey) => {
        setPerms(prev => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [permKey]: !prev[pageId]?.[permKey],
            },
        }));
    };

    const handleSelectAll = (permKey, value) => {
        setPerms(prev => {
            const next = { ...prev };
            pages.forEach(p => {
                next[p.pageId] = { ...next[p.pageId], [permKey]: value };
            });
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                pages: pages.map(p => ({
                    pageId: p.pageId,
                    canView: !!perms[p.pageId]?.canView,
                    canCreate: !!perms[p.pageId]?.canCreate,
                    canEdit: !!perms[p.pageId]?.canEdit,
                    canDelete: !!perms[p.pageId]?.canDelete,
                    canApprove: !!perms[p.pageId]?.canApprove,
                })),
            };
            await adminApi.saveRolePages(selectedRoleId, payload);
            toast.success('Permissions saved successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    // Group pages by page_group
    const groups = pages.reduce((acc, p) => {
        const g = p.pageGroup || 'other';
        if (!acc[g]) acc[g] = [];
        acc[g].push(p);
        return acc;
    }, {});

    return (
        <div>
            <PageHeader title="Page Permissions" subtitle="Control what each role can access">
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedRoleId}
                    className="btn-primary"
                >
                    {saving ? 'Saving...' : '💾 Save Permissions'}
                </button>
            </PageHeader>

            {/* Role selector */}
            <div className="card mb-4">
                <div className="card-body flex items-center gap-4">
                    <label className="label !mb-0 shrink-0">Select Role:</label>
                    <select
                        value={selectedRoleId}
                        onChange={e => setSelectedRoleId(e.target.value)}
                        className="input max-w-xs"
                    >
                        {roles.map(r => (
                            <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                        ))}
                    </select>
                    {selectedRoleId && (
                        <span className="text-sm text-slate-500">
                            {roles.find(r => String(r.roleId) === String(selectedRoleId))?.description}
                        </span>
                    )}
                </div>
            </div>

            {/* Permission matrix */}
            {loading ? (
                <div className="card">
                    <div className="card-body flex justify-center py-12 text-slate-400">Loading...</div>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 text-slate-600 font-semibold w-64">Page</th>
                                    {PERM_COLS.map(col => (
                                        <th key={col.key} className="text-center px-2 py-3 text-slate-600 font-semibold w-24">
                                            <div>{col.label}</div>
                                            <div className="flex items-center justify-center gap-1 mt-1">
                                                <button
                                                    onClick={() => handleSelectAll(col.key, true)}
                                                    className="text-xs text-primary-500 hover:underline"
                                                    title={`Enable ${col.label} for all`}
                                                >All</button>
                                                <span className="text-slate-300">|</span>
                                                <button
                                                    onClick={() => handleSelectAll(col.key, false)}
                                                    className="text-xs text-slate-400 hover:underline"
                                                    title={`Disable ${col.label} for all`}
                                                >None</button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groups).map(([group, items]) => (
                                    <tr key={`group-${group}`} className="contents">
                                    </tr>
                                ))}
                                {Object.entries(groups).flatMap(([group, items]) => [
                                    <tr key={`group-header-${group}`} className="bg-slate-100">
                                        <td colSpan={6} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            {GROUP_LABELS[group] || group}
                                        </td>
                                    </tr>,
                                    ...items.map((page, idx) => (
                                        <tr
                                            key={page.pageId}
                                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                                        >
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-slate-800">
                                                    {PAGE_NAMES[page.pageUrl] || page.pageName}
                                                </div>
                                                <div className="text-xs text-slate-400">{page.pageUrl}</div>
                                            </td>
                                            {PERM_COLS.map(col => (
                                                <td key={col.key} className="text-center px-2 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!perms[page.pageId]?.[col.key]}
                                                        onChange={() => handleToggle(page.pageId, col.key)}
                                                        className="w-4 h-4 accent-primary-500 cursor-pointer"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    )),
                                ])}

                                {pages.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">
                                            No pages found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedRoleId}
                    className="btn-primary"
                >
                    {saving ? 'Saving...' : '💾 Save Permissions'}
                </button>
            </div>
        </div>
    );
}
