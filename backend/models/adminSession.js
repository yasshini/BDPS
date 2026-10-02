'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AdminSession extends Model {
        static associate(models) {
            AdminSession.belongsTo(models.Admin, {
                foreignKey: 'admin_id',
                as: 'admin'
            });
        }
    }

    AdminSession.init(
        {
            token_hash: {
                type: DataTypes.STRING(64),
                primaryKey: true,
                allowNull: false
            },
            admin_id: {
                type: DataTypes.TINYINT.UNSIGNED,
                allowNull: false
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: 'AdminSession',
            tableName: 'admin_sessions',
            timestamps: false
        }
    );

    return AdminSession;
};
