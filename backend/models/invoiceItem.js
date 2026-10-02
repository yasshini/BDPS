'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class InvoiceItem extends Model {

        static associate(models) {

            InvoiceItem.belongsTo(models.Invoice, {
                foreignKey: 'invoice_id',
                as: 'invoice'
            });

            InvoiceItem.belongsTo(models.Product, {
                foreignKey: 'product_id',
                as: 'product'
            });
        }
    }

    InvoiceItem.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },

            invoice_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },

            product_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true
            },

            item_number: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false
            },

            item_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            quantity: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false
            },

            unit_price: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false
            },

            total_price: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false
            },

            discount_percentage: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            discount_amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'InvoiceItem',
            tableName: 'invoice_items',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return InvoiceItem;
};