import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('wms_user')); }
        catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('wms_token'));
    const [pages, setPages] = useState(() => {
        try { return JSON.parse(localStorage.getItem('wms_pages')) || []; }
        catch { return []; }
    });

    const login = useCallback(async (username, password) => {
        const res = await authApi.login({ username, password });
        const { token: jwt, ...userInfo } = res.data;

        localStorage.setItem('wms_token', jwt);
        localStorage.setItem('wms_user', JSON.stringify(userInfo));
        setToken(jwt);
        setUser(userInfo);

        // Lấy menu pages
        const pagesRes = await authApi.getMyPages();
        const pageList = pagesRes.data || [];
        localStorage.setItem('wms_pages', JSON.stringify(pageList));
        setPages(pageList);

        return userInfo;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('wms_token');
        localStorage.removeItem('wms_user');
        localStorage.removeItem('wms_pages');
        setToken(null);
        setUser(null);
        setPages([]);
    }, []);

    const isAuthenticated = !!token;
    const hasRole = (role) => user?.roleName === role;
    const isAdmin = () => hasRole('Admin');
    const isManager = () => hasRole('Manager') || hasRole('Admin');

    return (
        <AuthContext.Provider value={{ user, token, pages, isAuthenticated, login, logout, isAdmin, isManager }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
