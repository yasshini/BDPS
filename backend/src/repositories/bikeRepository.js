const { Bike, Customer, Invoice } = require('../../models');

class BikeRepository {

    async create(data) {
        return await Bike.create(data);
    }
    async findByBikeNumber(bikeNumber, { includeLastKilometer = false } = {}) {
        const bike = await Bike.findOne({
            where: {
                bike_number: bikeNumber
            },
            include: [
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });

        if (!bike) {
            return null;
        }

        if (includeLastKilometer) {
            const latestInvoice = await Invoice.findOne({
                attributes: ['kilometer'],
                where: {
                    bike_id: bike.id
                },
                order: [
                    ['service_datetime', 'DESC'],
                    ['id', 'DESC']
                ]
            });

            bike.setDataValue('last_kilometer', latestInvoice?.kilometer ?? null);
        }

        return bike;
    }
}

module.exports = new BikeRepository();