const { sequelize } = require('../models');

async function testDatabaseConnection() {
    try {
        await sequelize.authenticate();

        console.log('✅ Database connection successful');
        console.log('✅ Sequelize models loaded successfully');
    } catch (error) {
        console.error('❌ Database connection failed');
        console.error(error.message);
    } finally {
        await sequelize.close();
    }
}

testDatabaseConnection();