const isProduction = process.env.NODE_ENV === 'production';

const configuredOrigins = process.env.CORS_ORIGINS || (
    isProduction
        ? ''
        : 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5178,http://127.0.0.1:5178'
);

const allowedOrigins = configuredOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(origin => {
        let parsedOrigin;

        try {
            parsedOrigin = new URL(origin);
        } catch {
            throw new Error('CORS_ORIGINS must contain valid origins.');
        }

        if (
            parsedOrigin.origin !== origin ||
            (isProduction && parsedOrigin.protocol !== 'https:')
        ) {
            throw new Error(
                'CORS_ORIGINS must contain exact HTTPS origins in production.'
            );
        }

        return origin;
    });

const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();

function validateSecurityConfig() {
    if (allowedOrigins.length === 0) {
        throw new Error('Configure at least one trusted origin in CORS_ORIGINS.');
    }

    if (!['strict', 'lax', 'none'].includes(sameSite)) {
        throw new Error(
            'AUTH_COOKIE_SAME_SITE must be strict, lax, or none.'
        );
    }

    if (sameSite === 'none' && !isProduction) {
        throw new Error('Cross-site cookies require HTTPS.');
    }
}

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/'
};

module.exports = {
    allowedOrigins,
    cookieOptions,
    isProduction,
    validateSecurityConfig
};
