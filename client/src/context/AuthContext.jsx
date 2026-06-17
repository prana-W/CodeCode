import {createContext, useContext, useState, useEffect} from 'react';
import api, {setAuthLogoutCallback} from '@/lib/axios';

const AuthContext = createContext(null);

/**
 * Provides global authentication state and helpers.
 * User state is hydrated from the server on mount (GET /users/me) using the
 * httpOnly accessToken cookie — no sensitive data is stored in localStorage.
 * Wrap the entire app with this so any component can call useAuth().
 */
export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    // True while the initial /me fetch is in flight — prevents a flash of
    // "not logged in" redirects before we know the real auth state.
    const [authLoading, setAuthLoading] = useState(true);

    /**
     * On mount: ask the server who the current user is.
     * The accessToken httpOnly cookie is sent automatically.
     * If it's expired the Axios interceptor will transparently refresh it first.
     * If there is no valid session at all, we just stay logged out.
     */
    useEffect(() => {
        const hydrate = async () => {
            try {
                const res = await api.get('/users/me');
                setUser(res.data.data);
            } catch {
                // No valid session — user stays null (logged out)
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };
        hydrate();
    }, []);

    /**
     * Clears user state and invalidates the session on the server.
     * Called explicitly on logout, OR automatically by the Axios interceptor
     * when the refresh token has expired / is invalid.
     */
    const forceLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Server may be unreachable — still clear local state
        } finally {
            setUser(null);
        }
    };

    // Register the forceLogout callback so the Axios interceptor can trigger
    // a forced logout without a circular import.
    useEffect(() => {
        setAuthLogoutCallback(forceLogout);
    }, []);

    /**
     * POST /auth/login — sets user state on success.
     */
    const login = async (email, password) => {
        const res = await api.post('/auth/login', {email, password});
        setUser(res.data.data);
        return res.data;
    };

    /**
     * POST /auth/register — does NOT auto-login; caller should redirect to /login.
     */
    const register = async (payload) => {
        const res = await api.post('/auth/register', payload);
        return res.data;
    };

    /**
     * POST /auth/logout — nulls refresh token in DB, clears both cookies, clears user state.
     */
    const logout = async () => {
        await forceLogout();
    };

    return (
        <AuthContext.Provider
            value={{user, setUser, login, register, logout, authLoading}}
        >
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

export {AuthContext};
