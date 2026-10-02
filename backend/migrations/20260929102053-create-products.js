'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('products', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            item_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },

            default_price: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false
            },

            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
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
    },

    async down(queryInterface) {
        await queryInterface.dropTable('products');
    }
};