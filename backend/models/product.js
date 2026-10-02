'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Product extends Model {
        static associate(models) {
            Product.hasMany(models.InvoiceItem, {
                foreignKey: 'product_id',
                as: 'invoiceItems'
            });
        }
    }

    Product.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },

            item_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            default_price: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false
            },

            stock_quantity: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0
                }
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        },
        {
            sequelize,
            modelName: 'Product',
            tableName: 'products',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return Product;
};