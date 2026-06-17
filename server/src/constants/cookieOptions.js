const baseCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
};

// Access token: short-lived (5 minutes)
const accessTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 5 * 60 * 1000, // 5 minutes in ms
};

// Refresh token: long-lived (7 days)
const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export {accessTokenCookieOptions, refreshTokenCookieOptions};
