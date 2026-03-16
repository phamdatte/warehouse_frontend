import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { receiptApi } from '../../api/receiptApi';
import { issueApi } from '../../api/issueApi';
import { inventoryApi } from '../../api/inventoryApi';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

function StatCard({ title, value, icon, bgColor, textColor, to }) {
    return (
        <Link to={to} className="card hover:shadow-md transition-shadow cursor-pointer block">
            <div className="card-body p-5">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${bgColor} ${textColor}`}>
                        {icon}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500 mb-1">{title}</div>
                        <div className="text-2xl font-bold text-slate-800">{value}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState({
        pendingReceipts: 0,
        pendingIssues: 0,
        inventoryItems: 0,
        recentReceipts: [],
        recentIssues: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [receiptRes, issueRes, inventoryRes, pendingReceiptRes, pendingIssueRes] = await Promise.allSettled([
                    receiptApi.getAll({ size: 5, sort: 'createdAt,desc' }),
                    issueApi.getAll({ size: 5, sort: 'createdAt,desc' }),
                    inventoryApi.getAll({ size: 1 }),
                    receiptApi.getAll({ status: 'Pending', size: 1 }),
                    issueApi.getAll({ status: 'Pending', size: 1 })
                ]);

                // Helper to extract data or default
                const extractData = (res, path, defaultVal) => 
                    res.status === 'fulfilled' && res.value?.data ? res.value.data[path] : defaultVal;

                setStats({
                    recentReceipts: extractData(receiptRes, 'content', []),
                    recentIssues: extractData(issueRes, 'content', []),
                    inventoryItems: extractData(inventoryRes, 'totalElements', 0),
                    pendingReceipts: extractData(pendingReceiptRes, 'totalElements', 0),
                    pendingIssues: extractData(pendingIssueRes, 'totalElements', 0),
                });
            } catch (err) {
                console.error(err);
                // Only show toaster if there's a critical non-promise error
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Manager Dashboard" subtitle="Overview of warehouse operations" />

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Pending Receipts"
                    value={stats.pendingReceipts}
                    icon="📥"
                    bgColor="bg-amber-100"
                    textColor="text-amber-600"
                    to="/receipt?status=Pending"
                />
                <StatCard
                    title="Pending Issues"
                    value={stats.pendingIssues}
                    icon="📤"
                    bgColor="bg-blue-100"
                    textColor="text-blue-600"
                    to="/issue?status=Pending"
                />
                <StatCard
                    title="Inventory Items"
                    value={stats.inventoryItems}
                    icon="📦"
                    bgColor="bg-emerald-100"
                    textColor="text-emerald-600"
                    to="/inventory"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Receipts */}
                <div className="card">
                    <div className="card-header flex justify-between items-center border-b border-slate-100 p-5">
                        <h3 className="font-semibold text-slate-800">Recent Goods Receipts</h3>
                        <Link to="/receipt" className="text-sm text-primary-600 hover:text-primary-800 font-medium">View All</Link>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Code</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Date</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recentReceipts.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-5 py-4 text-center text-sm text-slate-500">No recent receipts</td>
                                    </tr>
                                ) : stats.recentReceipts.map(r => (
                                    <tr key={r.receiptId} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-medium text-slate-800">
                                            <Link to={`/receipt/${r.receiptId}`} className="hover:text-primary-600 font-semibold">{r.receiptNumber}</Link>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-slate-600">
                                            {r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-US') : ''}
                                        </td>
                                        <td className="px-5 py-3">
                                            <StatusBadge status={r.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Issues */}
                <div className="card">
                    <div className="card-header flex justify-between items-center border-b border-slate-100 p-5">
                        <h3 className="font-semibold text-slate-800">Recent Goods Issues</h3>
                        <Link to="/issue" className="text-sm text-primary-600 hover:text-primary-800 font-medium">View All</Link>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Code</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Date</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recentIssues.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-5 py-4 text-center text-sm text-slate-500">No recent issues</td>
                                    </tr>
                                ) : stats.recentIssues.map(i => (
                                    <tr key={i.issueId} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-medium text-slate-800">
                                            <Link to={`/issue/${i.issueId}`} className="hover:text-primary-600 font-semibold">{i.issueNumber}</Link>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-slate-600">
                                            {i.issueDate ? new Date(i.issueDate).toLocaleDateString('en-US') : ''}
                                        </td>
                                        <td className="px-5 py-3">
                                            <StatusBadge status={i.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Quick Report Links */}
            <div className="card mt-6">
                <div className="card-header border-b border-slate-100 p-5">
                    <h3 className="font-semibold text-slate-800">Quick Reports Access</h3>
                </div>
                <div className="card-body p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/report/receipt" className="btn-secondary flex justify-center py-3">
                        📊 Receipt Report
                    </Link>
                    <Link to="/report/issue" className="btn-secondary flex justify-center py-3">
                        📉 Issue Report
                    </Link>
                    <Link to="/report/inventory" className="btn-secondary flex justify-center py-3">
                        📈 Inventory Report
                    </Link>
                </div>
            </div>
        </div>
    );
}
