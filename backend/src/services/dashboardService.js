'use strict';

const dashboardRepository =
    require('../repositories/dashboardRepository');

class DashboardService {

    async getSummary() {
        return await dashboardRepository.getSummary();
    }

}

module.exports = new DashboardService();