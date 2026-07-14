import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../api/client';
import type { ApiResponse, User } from '../types';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (name: string, email: string, password: string) => Promise<User>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('flowboard_token');
        if (!token) {
            setLoading(false);
            return;
        }
        api
            .get<ApiResponse<{ user: User }>>('/auth/me')
            .then((res) => setUser(res.data.data.user))
            .catch(() => localStorage.removeItem('flowboard_token'))
            .finally(() => setLoading(false));
    }, []);

    async function login(email: string, password: string): Promise<User> {
        const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password });
        localStorage.setItem('flowboard_token', res.data.data.token);
        setUser(res.data.data.user);
        return res.data.data.user;
    }

    async function register(name: string, email: string, password: string): Promise<User> {
        const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', { name, email, password });
        localStorage.setItem('flowboard_token', res.data.data.token);
        setUser(res.data.data.user);
        return res.data.data.user;
    }

    function logout() {
        localStorage.removeItem('flowboard_token');
        setUser(null);
    }

    return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
