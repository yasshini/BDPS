'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../config/config.js'))[env];

const db = {};

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false
    }
);

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.endsWith('.js') &&
            !file.endsWith('.test.js')
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(
            sequelize,
            Sequelize.DataTypes
        );

        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (typeof db[modelName].associate === 'function') {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;