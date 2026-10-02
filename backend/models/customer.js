'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Customer extends Model {
        static associate(models) {
            Customer.hasMany(models.Bike, {
                foreignKey: 'customer_id',
                as: 'bikes'
            });

            Customer.hasMany(models.Invoice, {
                foreignKey: 'customer_id',
                as: 'invoices'
            });
        }
    }

    Customer.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },

            customer_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            contact_number: {
                type: DataTypes.STRING(20),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Customer',
            tableName: 'customers',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return Customer;
};