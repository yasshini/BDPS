const express = require('express');
const path = require('node:path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const { allowedOrigins, isProduction } = require('./config/security');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
app.use(helmet());
app.disable('x-powered-by');
app.use(cors({
    origin(origin, callback) {
        if (!origin) {
            return callback(null, false);
        }

        return callback(
            null,
            allowedOrigins.includes(origin) ? origin : false
        );
    },
    credentials: true
}));

app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

app.use(express.json({
    limit: '1mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '1mb'
}));

app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'BDPS eBill API is running'
    });
});

app.use('/api/auth', authRoutes);

if (!isProduction) {
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec)
    );
}

app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (isProduction) {
    const frontendPath = path.resolve(__dirname, '../public');
    app.use(express.static(frontendPath));
    app.get(/.*/, (req, res, next) => {
        if (
            req.path === '/api' ||
            req.path.startsWith('/api/') ||
            req.path === '/api-docs' ||
            req.path.startsWith('/api-docs/')
        ) {
            return next();
        }

        return res.sendFile(path.join(frontendPath, 'index.html'), error => {
            if (error) next(error);
        });
    });
}

/*
 * Global Error Handler
 */
app.use((error, req, res, next) => {
    const databaseErrorCode = error.parent?.code || error.original?.code;
    const isDatabaseAccessError = [
        'ER_ACCESS_DENIED_ERROR',
        'ER_DBACCESS_DENIED_ERROR'
    ].includes(databaseErrorCode);
    const statusCode = isDatabaseAccessError ? 503 : (error.statusCode || 500);
    if (statusCode >= 500) {
        console.error(error);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code: isDatabaseAccessError
                ? 'DATABASE_UNAVAILABLE'
                : (error.code || 'INTERNAL_SERVER_ERROR'),
            message: statusCode >= 500
                ? 'An unexpected server error occurred.'
                : error.message
        }
    });
});

module.exports = app;