'use strict';

const dashboardService =
    require('../services/dashboardService');

class DashboardController {

    async getSummary(req, res, next) {
        try {

            const data =
                await dashboardService.getSummary();

            res.status(200).json({
                success: true,
                data
            });

        } catch (error) {
            next(error);
        }
    }

}

module.exports = new DashboardController();