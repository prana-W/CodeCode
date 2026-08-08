import rateLimit from 'express-rate-limit';

// Global API Limiter
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 10000,
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
    windowMs: 1 * 60 * 1000,
    limit: 1000,
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
    limit: 500,
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
    windowMs: 1 * 60 * 1000,
    limit: 500,
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
    limit: 1500,
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
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message: 'Too many registration attempts. Please wait 10 minutes.',
    },
});

// AI Assistant Limiter
export const aiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message:
            'You have reached your AI assistant limit. Please wait 5 minutes.',
    },
});

// Password Reset Limiter — strict, 5 tries per 5 minutes per IP
export const passwordResetLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message:
            'Too many password reset attempts. Please wait 5 minutes before trying again.',
    },
});
