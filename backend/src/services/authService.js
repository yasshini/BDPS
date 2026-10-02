const { createHash, randomBytes } = require('node:crypto');
const { sequelize } = require('../../models');
const AppError = require('../errors/AppError');
const adminRepository = require('../repositories/adminRepository');
const {
    hashPassword,
    isValidPassword,
    verifyPassword
} = require('../utils/passwordHash');

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function makeError(message, statusCode, code) {
    return new AppError(message, statusCode, code);
}

function validateAdminDetails({ username, email, password }) {
    const normalizedUsername =
        typeof username === 'string' ? username.trim() : '';
    const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedUsername || normalizedUsername.length > 64) {
        throw makeError(
            'Username is required and must be 64 characters or fewer.',
            400,
            'INVALID_USERNAME'
        );
    }

    if (
        normalizedEmail.length > 254 ||
        !EMAIL_PATTERN.test(normalizedEmail)
    ) {
        throw makeError('Enter a valid email address.', 400, 'INVALID_EMAIL');
    }

    if (!isValidPassword(password)) {
        throw makeError(
            'Password must be 6–64 characters and include uppercase, lowercase, number, and special character.',
            400,
            'INVALID_PASSWORD'
        );
    }

    return { username: normalizedUsername, email: normalizedEmail };
}

async function createAdmin(input) {
    const existingAdmin = await adminRepository.findAdmin();

    if (existingAdmin) {
        throw makeError(
            'Admin account already exists.',
            409,
            'ADMIN_ALREADY_EXISTS'
        );
    }

    const details = validateAdminDetails(input);

    try {
        return await sequelize.transaction(async transaction => {
            const admin = await adminRepository.createAdmin({
                ...details,
                password_hash: await hashPassword(input.password)
            }, transaction);

            return { id: admin.id, username: admin.username };
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw makeError(
                'Admin account already exists.',
                409,
                'ADMIN_ALREADY_EXISTS'
            );
        }
        throw error;
    }
}

async function login(username, password) {
    const admin = await adminRepository.findAdmin();

    if (
        !admin ||
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !(await verifyPassword(password, admin.password_hash)) ||
        username.trim() !== admin.username
    ) {
        throw makeError(
            'Invalid username or password.',
            401,
            'INVALID_CREDENTIALS'
        );
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    const tokenHash = hashToken(token);

    await adminRepository.createSession({
        token_hash: tokenHash,
        admin_id: admin.id,
        expires_at: expiresAt
    });

    return {
        token,
        expiresAt,
        user: { username: admin.username }
    };
}

async function authenticate(token) {
    if (typeof token !== 'string' || token.length > 128) {
        return null;
    }

    const tokenHash = hashToken(token);
    const session = await adminRepository.findSession(tokenHash);

    if (!session?.admin) {
        return null;
    }

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    await adminRepository.refreshSession(session, expiresAt);

    return {
        id: session.admin.id,
        username: session.admin.username,
        tokenHash,
        expiresAt
    };
}

async function logout(token) {
    if (typeof token === 'string' && token.length > 0 && token.length <= 128) {
        await adminRepository.deleteSession(hashToken(token));
    }
}

module.exports = {
    authenticate,
    createAdmin,
    hashToken,
    login,
    logout
};
