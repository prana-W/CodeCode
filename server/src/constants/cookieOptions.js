const baseCookieOptions = {
    httpOnly: true, // this prevents browser from reading cookie via js 

    // Both are coupled together to send cookies to different origin (as our client and server is in different domains)
    secure: true,
    sameSite: 'none',
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
