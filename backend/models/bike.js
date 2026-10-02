'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class Bike extends Model {

        static associate(models) {

            Bike.belongsTo(models.Customer, {
                foreignKey: 'customer_id',
                as: 'customer'
            });

            Bike.hasMany(models.Invoice, {
                foreignKey: 'bike_id',
                as: 'invoices'
            });
        }
    }

    Bike.init(
        {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true
            },

            customer_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false
            },

            bike_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },

            bike_model: {
                type: DataTypes.STRING(100),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Bike',
            tableName: 'bikes',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return Bike;
};