'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Admin extends Model {}

    Admin.init(
        {
            id: {
                type: DataTypes.TINYINT.UNSIGNED,
                primaryKey: true,
                allowNull: false
            },
            username: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true
            },
            email: {
                type: DataTypes.STRING(254),
                allowNull: false,
                unique: true
            },
            password_hash: {
                type: DataTypes.STRING(255),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Admin',
            tableName: 'admins',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return Admin;
};
