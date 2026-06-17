import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Forced-logout callback ───────────────────────────────────────────────────
// AuthContext registers its logout function here so the interceptor can trigger
// it without a circular import. Set once on app mount via setAuthLogoutCallback.
let authLogoutCallback = null;

export const setAuthLogoutCallback = (fn) => {
    authLogoutCallback = fn;
};

// ─── Response interceptor — silent token refresh ──────────────────────────────
let isRefreshing = false;
let refreshSubscribers = []; // queue of callbacks waiting for the new token

const subscribeToRefresh = (callback) => refreshSubscribers.push(callback);

const notifySubscribers = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
};

api.interceptors.response.use(
    // Pass successful responses straight through
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        const isExpiredAccessToken =
            error.response?.status === 401 &&
            error.response?.data?.message === 'Access token has expired.' &&
            !originalRequest._retry; // prevent infinite retry loop

        if (isExpiredAccessToken) {
            // If another request is already triggering a refresh, queue this one
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeToRefresh(() => {
                        api(originalRequest).then(resolve).catch(reject);
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Ask the server for a new access token using the refresh token cookie
                await api.post('/auth/refresh');

                // Notify all queued requests that the token is fresh
                notifySubscribers();

                // Retry the original failed request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token is also expired or invalid — force logout
                refreshSubscribers = [];
                if (authLogoutCallback) {
                    authLogoutCallback();
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
