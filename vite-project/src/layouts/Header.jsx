import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.info('Đã đăng xuất');
        navigate('/login', { replace: true });
    };

    return (
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
                <h2 className="text-sm font-semibold text-slate-800">Warehouse Management System</h2>
            </div>
            <div className="flex items-center gap-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                    {user?.roleName}
                </span>
                <span className="text-sm text-slate-600 font-medium">{user?.fullName}</span>
                <button
                    onClick={handleLogout}
                    className="btn-secondary btn-sm text-red-600 border-red-200 hover:bg-red-50"
                >
                    Đăng xuất
                </button>
            </div>
        </header>
    );
}
