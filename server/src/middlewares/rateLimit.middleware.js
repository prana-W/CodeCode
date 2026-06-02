import rateLimit from 'express-rate-limit';

// Global API Limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message:
            'Too many requests from this IP, please try again after 15 minutes.',
    },
});

// Authentication Limiter (Login/Register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10, // Limit each IP to 10 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message:
            'Too many authentication attempts from this IP, please try again after 15 minutes.',
    },
});

// Submission Limiter (Prevent Judge Spam)
export const submissionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 5, // Limit each IP to 5 submissions per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message:
            'You are submitting too fast. Please wait a minute before submitting again.',
    },
});

// Contest Creation Limiter
export const contestCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5, // Limit each IP to 5 contest creations per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message: 'Too many contests created. Please try again after an hour.',
    },
});

// Profile Update Limiter
export const profileUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15, // Limit each IP to 15 profile updates per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message:
            'Too many profile updates. Please wait before updating your profile again.',
    },
});

// Contest Registration Limiter
export const contestRegistrationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10, // Limit each IP to 10 contest registrations per 10 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message: 'Too many registration attempts. Please wait 10 minutes.',
    },
});
