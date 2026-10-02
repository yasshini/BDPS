const customerRepository = require('../repositories/customerRepository');
const AppError = require('../errors/AppError');

class CustomerService {

    async createCustomer(customerData) {

        const existingCustomer =
            await customerRepository.findByContactNumber(
                customerData.contact_number
            );

        if (existingCustomer) {
            throw new AppError(
                'Customer with this contact number already exists',
                409,
                'CUSTOMER_ALREADY_EXISTS'
            );
        }

        return await customerRepository.create(customerData);
    }

    async getAllCustomers() {
        return await customerRepository.findAll();
    }
}

module.exports = new CustomerService();