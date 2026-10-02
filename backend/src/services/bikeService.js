const bikeRepository = require('../repositories/bikeRepository');
const AppError = require('../errors/AppError');

class BikeService {

    async createBike(bikeData) {

        const existingBike =
            await bikeRepository.findByBikeNumber(
                bikeData.bike_number
            );

        if (existingBike) {
            throw new AppError(
                'Bike with this bike number already exists',
                409,
                'BIKE_ALREADY_EXISTS'
            );
        }

        return await bikeRepository.create(bikeData);
    }
    async getBikeByNumber(bikeNumber) {

        const bike =
            await bikeRepository.findByBikeNumber(
                bikeNumber,
                { includeLastKilometer: true }
            );

        if (!bike) {
            throw new AppError(
                'Bike not found',
                404,
                'BIKE_NOT_FOUND'
            );
        }

        return bike;
    }
}

module.exports = new BikeService();