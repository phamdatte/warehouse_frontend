import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GROUP_ICONS = {
    dashboard: '🏠',
    receipt: '📥',
    issue: '📤',
    inventory: '📦',
    report: '📊',
    master: '⚙️',
    admin: '👤',
};

const GROUP_NAMES = {
    dashboard: 'Dashboard',
    receipt: 'Goods Receipt',
    issue: 'Goods Issue',
    inventory: 'Inventory',
    report: 'Reports',
    master: 'Master Data',
    admin: 'System Admin',
};

const PAGE_NAMES = {
    '/dashboard': 'Dashboard',
    '/receipt': 'Receipt List',
    '/receipt/create': 'Create Receipt',
    '/issue': 'Issue List',
    '/issue/create': 'Create Issue',
    '/inventory': 'Current Inventory',
    '/inventory/history': 'Transaction History',
    '/report/receipt': 'Receipt Report',
    '/report/issue': 'Issue Report',
    '/report/inventory': 'Inventory Report',
    '/product': 'Products',
    '/category': 'Categories',
    '/vendor': 'Vendors',
    '/customer': 'Customers',
    '/admin/user': 'Users',
    '/admin/role': 'Roles',
    '/admin/page-permission': 'Page Permissions',
};

// Map page_url → route path trong React Router
const URL_MAP = {
    '/dashboard': '/',
    '/receipt': '/receipt',
    '/receipt/create': '/receipt/create',
    '/receipt/approve': '/receipt',
    '/issue': '/issue',
    '/issue/create': '/issue/create',
    '/issue/approve': '/issue',
    '/inventory': '/inventory',
    '/inventory/history': '/inventory/history',
    '/report/receipt': '/report/receipt',
    '/report/issue': '/report/issue',
    '/report/inventory': '/report/inventory',
    '/product': '/product',
    '/category': '/category',
    '/vendor': '/vendor',
    '/customer': '/customer',
    '/admin/user': '/admin/user',
};

export default function Sidebar() {
    const { pages, user } = useAuth();

    // Nhóm pages theo page_group, chỉ lấy is_menu=true
    // Ẩn các mục "duyệt" riêng lẻ vì chức năng đã tích hợp vào trang chi tiết
    const HIDDEN_URLS = ['/receipt/approve', '/issue/approve'];
    const menuItems = pages.filter((p) => p.isMenu !== false && !HIDDEN_URLS.includes(p.pageUrl));
    const groups = menuItems.reduce((acc, p) => {
        const g = p.pageGroup || 'other';
        if (!acc[g]) acc[g] = [];
        acc[g].push(p);
        return acc;
    }, {});

    return (
        <aside className="w-64 flex-shrink-0 bg-sidebar-bg flex flex-col h-full">
            {/* Brand */}
            <div className="px-6 py-5 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">W</div>
                    <div>
                        <div className="text-white font-semibold text-sm leading-tight">Warehouse</div>
                        <div className="text-slate-400 text-xs">Manager</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {Object.entries(groups).map(([group, items]) => (
                    <div key={group} className="mb-4">
                        <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-1">
                            {GROUP_ICONS[group] || '•'} {GROUP_NAMES[group] || group}
                        </div>
                        {items.map((page) => {
                            const to = URL_MAP[page.pageUrl] || page.pageUrl;
                            // Require exact match for dashboard (/), and root list pages to prevent sub-routes from highlighting them.
                            // e.g., `/receipt` shouldn't be active when we are on `/receipt/create`
                            const exactMatch = to === '/' || to === '/receipt' || to === '/issue' || to === '/inventory';
                            return (
                                <NavLink
                                    key={page.pageId}
                                    to={to}
                                    end={exactMatch}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${isActive
                                            ? 'bg-primary-500 text-white font-medium'
                                            : 'text-sidebar-text hover:bg-slate-700'
                                        }`
                                    }
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                                    {PAGE_NAMES[page.pageUrl] || page.pageName}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User info at bottom */}
            <div className="px-4 py-3 border-t border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                        {user?.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium truncate">{user?.fullName}</div>
                        <div className="text-slate-400 text-xs">{user?.roleName}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
