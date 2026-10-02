const AppError = require('../errors/AppError');

function validateCustomer(req, res, next) {

    const { customer_name, contact_number } = req.body;

    if (!customer_name || customer_name.trim() === '') {
        return next(
            new AppError(
                'Customer name is required',
                400,
                'CUSTOMER_NAME_REQUIRED'
            )
        );
    }

    if (!contact_number || contact_number.trim() === '') {
        return next(
            new AppError(
                'Contact number is required',
                400,
                'CONTACT_NUMBER_REQUIRED'
            )
        );
    }

    next();
}

module.exports = {
    validateCustomer
};