const customerService = require('../services/customerService');

class CustomerController {

    async create(req, res, next) {
        try {

            const customer =
                await customerService.createCustomer(req.body);

            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: customer
            });

        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {

            const customers =
                await customerService.getAllCustomers();

            res.status(200).json({
                success: true,
                data: customers
            });

        } catch (error) {
            next(error);
        }
    }

}

module.exports = new CustomerController();