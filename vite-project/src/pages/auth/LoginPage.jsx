import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password) {
            setError('Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }
        setLoading(true);
        try {
            await login(form.username, form.password);
            toast.success('Đăng nhập thành công!');
            navigate('/', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-primary-700">
            <div className="w-full max-w-md mx-4">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Warehouse Manager</h1>
                    <p className="text-slate-400 text-sm mt-1">Hệ thống quản lý kho</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">Đăng nhập</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Tên đăng nhập</label>
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                className={`input ${error ? 'input-error' : ''}`}
                                placeholder="admin"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="label">Mật khẩu</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className={`input ${error ? 'input-error' : ''}`}
                                placeholder="••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-2.5 mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Đang đăng nhập...
                                </>
                            ) : 'Đăng nhập'}
                        </button>
                    </form>

                    <p className="text-xs text-slate-400 text-center mt-6">
                        Mật khẩu mặc định: <span className="font-mono">123456</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
