const bikeService = require('../services/bikeService');

class BikeController {

    async create(req, res, next) {

        try {

            const bike =
                await bikeService.createBike(req.body);

            res.status(201).json({
                success: true,
                message: 'Bike created successfully',
                data: bike
            });

        } catch (error) {
            next(error);
        }
    }


    async getByNumber(req, res, next) {

        try {

            const bike =
                await bikeService.getBikeByNumber(
                    req.params.bikeNumber
                );

            res.status(200).json({
                success: true,
                data: bike
            });

        } catch (error) {
            next(error);
        }
    }


}

module.exports = new BikeController();