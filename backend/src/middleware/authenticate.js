const AppError = require('../errors/AppError');
const authService = require('../services/authService');
const { allowedOrigins, cookieOptions } = require('../config/security');

async function authenticate(req, res, next) {
    try {
        const auth = await authService.authenticate(
            req.cookies?.bdps_session
        );

        if (!auth) {
            return next(new AppError(
                'Authentication required.',
                401,
                'AUTHENTICATION_REQUIRED'
            ));
        }

        req.auth = auth;
        res.cookie('bdps_session', req.cookies.bdps_session, {
            ...cookieOptions,
            maxAge: auth.expiresAt.getTime() - Date.now()
        });

        return next();
    } catch (error) {
        return next(error);
    }
}

function requireTrustedOrigin(req, res, next) {
    const origin = req.get('origin');

    if (!origin || !allowedOrigins.includes(origin)) {
        return next(new AppError(
            'This request origin is not allowed.',
            403,
            'ORIGIN_NOT_ALLOWED'
        ));
    }

    return next();
}

module.exports = { authenticate, requireTrustedOrigin };
