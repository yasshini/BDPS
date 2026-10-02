const { Customer } = require('../../models');

class CustomerRepository {

    async create(customerData) {
        return await Customer.create(customerData);
    }

    async findByContactNumber(contactNumber) {
        return await Customer.findOne({
            where: {
                contact_number: contactNumber
            }
        });
    }

    async findAll() {
        return await Customer.findAll({
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = new CustomerRepository();