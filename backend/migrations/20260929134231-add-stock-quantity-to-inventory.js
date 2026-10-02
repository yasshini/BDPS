'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'products',
            'stock_quantity',
            {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(
            'products',
            'stock_quantity'
        );
    }
};