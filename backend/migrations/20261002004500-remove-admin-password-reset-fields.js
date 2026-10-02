'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.removeColumn(
            'admins',
            'password_reset_token_hash'
        );
        await queryInterface.removeColumn(
            'admins',
            'password_reset_expires_at'
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('admins', 'password_reset_token_hash', {
            type: Sequelize.STRING(64),
            allowNull: true,
            unique: true
        });
        await queryInterface.addColumn('admins', 'password_reset_expires_at', {
            type: Sequelize.DATE,
            allowNull: true
        });
    }
};
