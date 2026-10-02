'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bikes', {
            id: {
                type: Sequelize.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
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

            bike_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },

            bike_model: {
                type: Sequelize.STRING(100),
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
        await queryInterface.dropTable('bikes');
    }
};