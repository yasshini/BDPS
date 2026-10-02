const { cookieOptions } = require('../config/security');
const AppError = require('../errors/AppError');
const adminRepository = require('../repositories/adminRepository');
const authService = require('../services/authService');

const COOKIE_NAME = 'bdps_session';
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

async function getStatus(req, res, next) {
    try {
        const admin = await adminRepository.findAdmin();
        return res.status(200).json({
            success: true,
            data: { adminExists: Boolean(admin) }
        });
    } catch (error) {
        return next(error);
    }
}

async function register(req, res, next) {
    try {
        const admin = await authService.createAdmin(req.body || {});
        const session = await authService.login(
            admin.username,
            req.body.password
        );

        res.cookie(COOKIE_NAME, session.token, {
            ...cookieOptions,
            maxAge: SESSION_LIFETIME_MS
        });

        return res.status(201).json({
            success: true,
            data: session.user
        });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body || {};
        if (typeof username !== 'string' || typeof password !== 'string') {
            throw new AppError(
                'Invalid username or password.',
                401,
                'INVALID_CREDENTIALS'
            );
        }

        const session = await authService.login(username, password);
        res.cookie(COOKIE_NAME, session.token, {
            ...cookieOptions,
            maxAge: SESSION_LIFETIME_MS
        });

        return res.status(200).json({
            success: true,
            data: session.user
        });
    } catch (error) {
        return next(error);
    }
}

async function logout(req, res, next) {
    try {
        await authService.logout(req.cookies?.bdps_session);
        res.clearCookie(COOKIE_NAME, cookieOptions);
        return res.status(200).json({ success: true });
    } catch (error) {
        return next(error);
    }
}

function getMe(req, res) {
    return res.status(200).json({
        success: true,
        data: { username: req.auth.username }
    });
}

module.exports = {
    getMe,
    getStatus,
    login,
    logout,
    register
};
