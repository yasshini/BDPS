'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('invoices', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            invoice_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },

            customer_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            bike_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                references: {
                    model: 'bikes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },

            kilometer: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false
            },

            service_datetime: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            sub_total: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            total: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            payment_type: {
                type: Sequelize.STRING(30),
                allowNull: false
            },

            paid_amount: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            balance_amount: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
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
        await queryInterface.dropTable('invoices');
    }
};