const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'BDPS eBill API',
            version: '1.0.0',
            description: 'BDPS eBill API documentation'
        },

        servers: [
            {
                url: process.env.API_PUBLIC_URL || 'http://localhost:5000'
            }
        ],

        components: {
            securitySchemes: {
                adminSession: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'bdps_session'
                }
            }
        }
    },

    apis: ['./src/docs/*.js']
};

module.exports = swaggerJsdoc(options);