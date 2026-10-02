require('dotenv').config();

const app = require('./app');
const { validateSecurityConfig } = require('./config/security');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || (
    process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'
);

validateSecurityConfig();

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});