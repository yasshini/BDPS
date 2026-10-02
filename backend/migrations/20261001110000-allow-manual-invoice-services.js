'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('invoice_items', 'product_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('invoice_items', 'product_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false
        });
    }
};
