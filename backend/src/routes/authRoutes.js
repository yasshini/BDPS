const express = require('express');
const { rateLimit } = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate, requireTrustedOrigin } =
    require('../middleware/authenticate');

const router = express.Router();
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

const createRateLimit = (limit, windowMs) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
        success: false,
        error: {
            code: 'AUTH_RATE_LIMITED',
            message: 'Too many attempts. Try again later.'
        }
    })
});

router.get('/status', authController.getStatus);
router.post(
    '/register',
    requireTrustedOrigin,
    createRateLimit(5, 60 * 60 * 1000),
    authController.register
);
router.post(
    '/login',
    requireTrustedOrigin,
    createRateLimit(5, 15 * 60 * 1000),
    authController.login
);
router.post(
    '/logout',
    requireTrustedOrigin,
    authController.logout
);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
