'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('invoice_items', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            invoice_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'invoices',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },

            product_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            item_number: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },

            item_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },

            quantity: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },

            unit_price: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false
            },

            total_price: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false
            },

            discount_percentage: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            discount_amount: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            amount: {
                type: Sequelize.DECIMAL(12, 2),
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
                defaultValue: Sequelize.literal(
                    'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
                )
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('invoice_items');
    }
};