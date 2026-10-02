'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('admins', {
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
            email: {
                type: Sequelize.STRING(254),
                allowNull: false,
                unique: true
            },
            password_hash: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            password_reset_token_hash: {
                type: Sequelize.STRING(64),
                allowNull: true,
                unique: true
            },
            password_reset_expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal(
                    'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                )
            }
        });

        await queryInterface.createTable('admin_sessions', {
            token_hash: {
                type: Sequelize.STRING(64),
                primaryKey: true,
                allowNull: false
            },
            admin_id: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'admins',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('admin_sessions', ['expires_at']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('admin_sessions');
        await queryInterface.dropTable('admins');
    }
};
