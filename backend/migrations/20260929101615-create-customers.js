'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customers', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            customer_name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },

            contact_number: {
                type: Sequelize.STRING(20),
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
        await queryInterface.dropTable('customers');
    }
};