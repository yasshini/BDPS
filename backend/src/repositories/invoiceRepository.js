const {
    Invoice,
    InvoiceItem,
    Customer,
    Bike,
    Product
} = require('../../models');

class InvoiceRepository {

    async create(invoiceData, transaction) {
        return await Invoice.create(invoiceData, {
            transaction
        });
    }

    async createItem(itemData, transaction) {
        return await InvoiceItem.create(itemData, {
            transaction
        });
    }

    async findById(id, transaction = null) {
        return await Invoice.findByPk(id, {
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Bike,
                    as: 'bike'
                },
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [
                        {
                            model: Product,
                            as: 'product'
                        }
                    ]
                }
            ],
            transaction
        });
    }

    async findByIdForUpdate(id, transaction) {
        return await Invoice.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
    }

    async deleteItemsByInvoiceId(invoiceId, transaction) {
        return await InvoiceItem.destroy({
            where: {
                invoice_id: invoiceId
            },
            transaction
        });
    }

    async findByInvoiceNumber(invoiceNumber) {
        return await Invoice.findOne({
            where: {
                invoice_number: invoiceNumber
            }
        });
    }

    async findAll() {
        return await Invoice.findAll({
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: Bike,
                    as: 'bike'
                },
                {
                    model: InvoiceItem,
                    as: 'items'
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async update(id, data, transaction) {
        const invoice = await Invoice.findByPk(id, {
            transaction
        });

        if (!invoice) {
            return null;
        }

        await invoice.update(data, {
            transaction
        });

        return invoice;
    }
}

module.exports = new InvoiceRepository();