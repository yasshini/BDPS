const { Admin, AdminSession } = require('../../models');
const { Op } = require('sequelize');

class AdminRepository {
    async findAdmin() {
        return Admin.findByPk(1);
    }

    async createAdmin(data, transaction) {
        return Admin.create({ ...data, id: 1 }, { transaction });
    }

    async createSession(session) {
        return AdminSession.create(session);
    }

    async findSession(tokenHash, now = new Date()) {
        return AdminSession.findOne({
            where: {
                token_hash: tokenHash,
                expires_at: { [Op.gt]: now }
            },
            include: [{
                model: Admin,
                as: 'admin',
                attributes: ['id', 'username', 'email']
            }]
        });
    }

    async refreshSession(session, expiresAt) {
        await session.update({ expires_at: expiresAt });
    }

    async deleteSession(tokenHash) {
        return AdminSession.destroy({ where: { token_hash: tokenHash } });
    }

}

module.exports = new AdminRepository();
