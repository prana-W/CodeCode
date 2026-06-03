import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';

const AuthContext = createContext(null);

/**
 * Provides global authentication state and helpers.
 * Wrap the entire app with this so any component can call useAuth().
 */
export function AuthProvider({ children }) {
    // Initialize user from localStorage if it exists
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error('Error reading user from localStorage:', error);
            return null;
        }
    });

    /**
     * POST /auth/login — sets user state on success.
     * @param {string} email
     * @param {string} password
     * @returns {Promise} resolves with response data
     */
    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return res.data;
    };

    /**
     * POST /auth/register — does NOT auto-login; caller should redirect to /login.
     * @param {object} payload — { username, name, email, password, institute? }
     * @returns {Promise} resolves with response data
     */
    const register = async (payload) => {
        const res = await api.post('/auth/register', payload);
        return res.data;
    };

    /**
     * POST /auth/logout — clears server cookie and local user state.
     */
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Convenience hook — use instead of useContext(AuthContext) directly. */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

export { AuthContext };
