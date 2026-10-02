'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class Invoice extends Model {

        static associate(models) {

            Invoice.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });

            Invoice.belongsTo(models.Bike, {
                foreignKey: 'bike_id',
                as: 'bike'
            });

            Invoice.hasMany(models.InvoiceItem, {
                foreignKey: 'invoice_id',
                as: 'items'
            });
        }
    }

    Invoice.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },

            invoice_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },

            customer_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },

            bike_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },

            kilometer: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: false
            },

            service_datetime: {
                type: DataTypes.DATE,
                allowNull: false
            },

            sub_total: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            total: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            payment_type: {
                type: DataTypes.STRING(30),
                allowNull: false
            },

            paid_amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },

            balance_amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            }
        },
        {
            sequelize,
            modelName: 'Invoice',
            tableName: 'invoices',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return Invoice;
};