// In production (HTTPS) we need secure + sameSite:none for cross-origin cookies.
// In development (HTTP localhost) secure:true causes browsers to silently drop
// the cookie, so the refresh token never reaches the server → spurious logouts.
const isProd = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
    httpOnly: true, // prevents browser JS from reading the cookie
    secure: isProd,                    // false on localhost (HTTP), true in prod (HTTPS)
    sameSite: isProd ? 'none' : 'lax', // 'none' requires secure:true (cross-origin prod)
};

const accessTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes in ms — must match JWT_ACCESS_EXPIRES_IN
};

const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms — must match JWT_REFRESH_EXPIRES_IN
};

// Used with res.clearCookie() — MUST NOT include maxAge or the positive value
// fights against the epoch expiry that clearCookie sets, leaving the cookie alive.
const clearCookieOptions = {...baseCookieOptions};

export {accessTokenCookieOptions, refreshTokenCookieOptions, clearCookieOptions};
