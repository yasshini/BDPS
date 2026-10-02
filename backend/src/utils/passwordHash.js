const bcrypt = require('bcryptjs');
const PASSWORD_PATTERN =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{6,64}$/;

async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

async function verifyPassword(password, storedHash) {
    if (typeof storedHash !== 'string' || !storedHash.startsWith('$2')) {
        return false;
    }

    return bcrypt.compare(password, storedHash);
}

function isValidPassword(password) {
    return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}

module.exports = { hashPassword, isValidPassword, verifyPassword };
