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
    maxAge: 5 * 60 * 1000, // 5 minutes in ms
};

const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export {accessTokenCookieOptions, refreshTokenCookieOptions};
