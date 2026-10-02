const invoiceService =
    require('../services/invoiceService');

class InvoiceController {

    async create(req, res, next) {

        try {

            const invoice =
                await invoiceService.createInvoice(
                    req.body
                );

            res.status(201).json({
                success: true,
                message: 'Invoice created successfully',
                data: invoice
            });

        } catch (error) {
            next(error);
        }
    }


    async getAll(req, res, next) {

        try {

            const invoices =
                await invoiceService.getAllInvoices();

            res.status(200).json({
                success: true,
                data: invoices
            });

        } catch (error) {
            next(error);
        }
    }


    async getById(req, res, next) {

        try {

            const invoice =
                await invoiceService.getInvoiceById(
                    req.params.id
                );

            res.status(200).json({
                success: true,
                data: invoice
            });

        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const invoice = await invoiceService.updateInvoice(
                req.params.id,
                req.body
            );

            res.status(200).json({
                success: true,
                message: 'Bill updated successfully',
                data: invoice
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new InvoiceController();