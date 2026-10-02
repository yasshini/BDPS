'use strict';

const {
    Customer,
    Bike,
    Product,
    Invoice
} = require('../../models');

const { Op } = require('sequelize');

class DashboardRepository {

    async getSummary() {

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const [
            totalCustomers,
            totalBikes,
            totalProducts,
            lowStockProducts,
            todayInvoices,
            todaySales
        ] = await Promise.all([

            Customer.count(),

            Bike.count(),

            Product.count({
                where: {
                    is_active: true
                }
            }),

            Product.count({
                where: {
                    is_active: true,
                    stock_quantity: {
                        [Op.lte]: 5
                    }
                }
            }),

            Invoice.count({
                where: {
                    service_datetime: {
                        [Op.gte]: todayStart,
                        [Op.lt]: tomorrowStart
                    }
                }
            }),

            Invoice.sum('total', {
                where: {
                    service_datetime: {
                        [Op.gte]: todayStart,
                        [Op.lt]: tomorrowStart
                    }
                }
            })
        ]);

        return {
            total_customers: totalCustomers,
            total_bikes: totalBikes,
            total_products: totalProducts,
            low_stock_products: lowStockProducts,
            today_invoices: todayInvoices,
            today_sales: todaySales || 0
        };
    }

}

module.exports = new DashboardRepository();