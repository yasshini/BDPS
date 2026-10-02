'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('app_credentials', {
            id: {
                type: Sequelize.TINYINT.UNSIGNED,
                primaryKey: true,
                allowNull: false
            },
            username: {
                type: Sequelize.STRING(64),
                allowNull: false,
                unique: true
            },
            password_hash: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            jwt_secret: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('app_credentials');
    }
};
