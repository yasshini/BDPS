const {
    sequelize,
    Product,
    Bike
} = require('../../models');

const invoiceRepository =
    require('../repositories/invoiceRepository');

const AppError =
    require('../errors/AppError');

class InvoiceService {

    async generateInvoiceNumber(transaction) {

        const lastInvoice = await sequelize.models.Invoice.findOne({
            order: [['id', 'DESC']],
            transaction
        });

        const nextNumber =
            lastInvoice
                ? Number(lastInvoice.id) + 1
                : 1;

        return `BDPS-${String(nextNumber).padStart(4, '0')}`;
    }


    async createInvoice(invoiceData) {

        const transaction =
            await sequelize.transaction();

        try {

            /*
             * Validate bike
             */
            const bike = await Bike.findByPk(
                invoiceData.bike_id,
                {
                    transaction
                }
            );

            if (!bike) {
                throw new AppError(
                    'Bike not found',
                    404,
                    'BIKE_NOT_FOUND'
                );
            }


            /*
             * Ensure invoice customer
             * matches bike customer
             */
            if (
                Number(bike.customer_id) !==
                Number(invoiceData.customer_id)
            ) {
                throw new AppError(
                    'Bike does not belong to this customer',
                    400,
                    'CUSTOMER_BIKE_MISMATCH'
                );
            }


            /*
             * Validate items
             */
            if (
                !Array.isArray(invoiceData.items) ||
                invoiceData.items.length === 0
            ) {
                throw new AppError(
                    'At least one invoice item is required',
                    400,
                    'INVOICE_ITEMS_REQUIRED'
                );
            }


            /*
             * Generate invoice number
             */
            const invoiceNumber =
                await this.generateInvoiceNumber(
                    transaction
                );


            let subtotal = 0;
            let total = 0;

            const calculatedItems = [];
            const requestedQuantities = new Map();
            const productsById = new Map();


            for (const [index, inputItem] of invoiceData.items.entries()) {
                const quantity = Number(inputItem.quantity);
                const discountPercentage = Number(
                    inputItem.discount_percentage || 0
                );

                if (!Number.isInteger(quantity) || quantity <= 0) {
                    throw new AppError(
                        'Quantity must be a positive whole number',
                        400,
                        'INVALID_QUANTITY'
                    );
                }

                if (
                    !Number.isFinite(discountPercentage) ||
                    discountPercentage < 0 ||
                    discountPercentage > 100
                ) {
                    throw new AppError(
                        'Discount percentage must be between 0 and 100',
                        400,
                        'INVALID_DISCOUNT'
                    );
                }

                const hasProduct = inputItem.product_id !== null &&
                    inputItem.product_id !== undefined &&
                    inputItem.product_id !== '';
                let product = null;
                let itemName = String(inputItem.item_name || '').trim();

                if (hasProduct) {
                    product = await Product.findByPk(inputItem.product_id, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    if (!product) {
                        throw new AppError(
                            `Product ${inputItem.product_id} not found`,
                            404,
                            'PRODUCT_NOT_FOUND'
                        );
                    }

                    itemName = product.item_name;
                    const productId = String(product.id);
                    requestedQuantities.set(
                        productId,
                        (requestedQuantities.get(productId) || 0) + quantity
                    );
                    productsById.set(productId, product);
                } else if (!itemName || itemName.length > 100) {
                    throw new AppError(
                        'Custom service name is required and must be 100 characters or fewer',
                        400,
                        'INVALID_SERVICE_NAME'
                    );
                }

                const unitPrice = hasProduct
                    ? Number(product.default_price)
                    : inputItem.unit_price === null ||
                        inputItem.unit_price === undefined ||
                        inputItem.unit_price === ''
                        ? NaN
                        : Number(inputItem.unit_price);
                if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                    throw new AppError(
                        'Unit price must be a valid non-negative amount',
                        400,
                        'INVALID_UNIT_PRICE'
                    );
                }

                const totalPrice = unitPrice * quantity;
                const discountAmount =
                    totalPrice * discountPercentage / 100;
                const amount = totalPrice - discountAmount;
                subtotal += totalPrice;
                total += amount;

                calculatedItems.push({
                    product,
                    item_number: index + 1,
                    item_name: itemName,
                    quantity,
                    unit_price: unitPrice,
                    total_price: totalPrice,
                    discount_percentage: discountPercentage,
                    discount_amount: discountAmount,
                    amount
                });
            }

            for (const [productId, quantity] of requestedQuantities) {
                const product = productsById.get(productId);
                const availableQuantity = Number(product.stock_quantity);
                if (quantity > availableQuantity) {
                    throw new AppError(
                        `Insufficient stock for ${product.item_name}. Available: ${availableQuantity}.`,
                        400,
                        'INSUFFICIENT_STOCK'
                    );
                }
            }


            /*
             * Validate payment
             */
            const paidAmount =
                Number(
                    invoiceData.paid_amount || 0
                );

            if (paidAmount < 0) {
                throw new AppError(
                    'Paid amount cannot be negative',
                    400,
                    'INVALID_PAID_AMOUNT'
                );
            }

            if (paidAmount > total) {
                throw new AppError(
                    'Paid amount cannot be greater than invoice total',
                    400,
                    'PAID_AMOUNT_EXCEEDS_TOTAL'
                );
            }


            const balanceAmount =
                total - paidAmount;


            /*
             * Create invoice
             */
            const invoice =
                await invoiceRepository.create(
                    {
                        invoice_number:
                            invoiceNumber,

                        customer_id:
                            invoiceData.customer_id,

                        bike_id:
                            invoiceData.bike_id,

                        kilometer:
                            invoiceData.kilometer,

                        service_datetime:
                            invoiceData.service_datetime ||
                            new Date(),

                        sub_total:
                            subtotal,

                        total:
                            total,

                        payment_type:
                            invoiceData.payment_type,

                        paid_amount:
                            paidAmount,

                        balance_amount:
                            balanceAmount
                    },
                    transaction
                );


            /*
             * Create invoice items
             * and reduce stock
             */
            for (const item of calculatedItems) {

                await invoiceRepository.createItem(
                    {
                        invoice_id:
                            invoice.id,

                        product_id:
                            item.product?.id || null,

                        item_number:
                            item.item_number,

                        item_name:
                            item.item_name,

                        quantity:
                            item.quantity,

                        unit_price:
                            item.unit_price,

                        total_price:
                            item.total_price,

                        discount_percentage:
                            item.discount_percentage,

                        discount_amount:
                            item.discount_amount,

                        amount:
                            item.amount
                    },
                    transaction
                );


                /*
                 * Reduce stock
                 */
                if (item.product) {
                    await item.product.decrement(
                        'stock_quantity',
                        {
                            by: item.quantity,
                            transaction
                        }
                    );
                }
            }


            await transaction.commit();


            return await invoiceRepository.findById(
                invoice.id
            );

        } catch (error) {

            await transaction.rollback();

            throw error;
        }
    }


    async updateInvoice(id, invoiceData) {
        const transaction = await sequelize.transaction();

        try {
            const lockedInvoice = await invoiceRepository.findByIdForUpdate(
                id,
                transaction
            );

            if (!lockedInvoice) {
                throw new AppError(
                    'Bill not found',
                    404,
                    'INVOICE_NOT_FOUND'
                );
            }
            const invoice = await invoiceRepository.findById(
                lockedInvoice.id,
                transaction
            );

            if (
                !Array.isArray(invoiceData.items) ||
                invoiceData.items.length === 0
            ) {
                throw new AppError(
                    'At least one bill item is required',
                    400,
                    'INVOICE_ITEMS_REQUIRED'
                );
            }

            const previousQuantities = new Map();
            for (const item of invoice.items) {
                if (item.product_id === null) {
                    continue;
                }
                const productId = String(item.product_id);
                previousQuantities.set(
                    productId,
                    (previousQuantities.get(productId) || 0) +
                        Number(item.quantity)
                );
            }

            const requestedQuantities = new Map();
            for (const item of invoiceData.items) {
                const quantity = Number(item.quantity);

                if (!Number.isInteger(quantity) || quantity <= 0) {
                    throw new AppError(
                        'Quantity must be a positive whole number',
                        400,
                        'INVALID_QUANTITY'
                    );
                }

                if (
                    item.product_id !== null &&
                    item.product_id !== undefined &&
                    item.product_id !== ''
                ) {
                    const productId = String(item.product_id);
                    requestedQuantities.set(
                        productId,
                        (requestedQuantities.get(productId) || 0) + quantity
                    );
                }
            }

            const productIds = new Set([
                ...previousQuantities.keys(),
                ...requestedQuantities.keys()
            ]);
            const products = new Map();

            for (const productId of [...productIds].sort(
                (left, right) => Number(left) - Number(right)
            )) {
                const product = await Product.findByPk(productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!product) {
                    throw new AppError(
                        `Product ${productId} not found`,
                        404,
                        'PRODUCT_NOT_FOUND'
                    );
                }

                const availableQuantity =
                    Number(product.stock_quantity) +
                    (previousQuantities.get(productId) || 0);
                const requestedQuantity =
                    requestedQuantities.get(productId) || 0;

                if (availableQuantity < requestedQuantity) {
                    throw new AppError(
                        `Insufficient stock for ${product.item_name}`,
                        400,
                        'INSUFFICIENT_STOCK'
                    );
                }

                products.set(productId, {
                    product,
                    availableQuantity,
                    requestedQuantity
                });
            }

            let subtotal = 0;
            let total = 0;
            const calculatedItems = invoiceData.items.map(
                (inputItem, index) => {
                    const hasProduct = inputItem.product_id !== null &&
                        inputItem.product_id !== undefined &&
                        inputItem.product_id !== '';
                    const product = hasProduct
                        ? products.get(String(inputItem.product_id))?.product
                        : null;
                    const quantity = Number(inputItem.quantity);
                    const discountPercentage = Number(
                        inputItem.discount_percentage || 0
                    );
                    const itemName = hasProduct
                        ? product?.item_name
                        : String(inputItem.item_name || '').trim();
                    const unitPrice = hasProduct
                        ? Number(
                            inputItem.unit_price ?? product.default_price
                        )
                        : inputItem.unit_price === null ||
                            inputItem.unit_price === undefined ||
                            inputItem.unit_price === ''
                            ? NaN
                            : Number(inputItem.unit_price);

                    if (!itemName || itemName.length > 100) {
                        throw new AppError(
                            'Service name is required and must be 100 characters or fewer',
                            400,
                            'INVALID_SERVICE_NAME'
                        );
                    }

                    if (!Number.isInteger(quantity) || quantity <= 0) {
                        throw new AppError(
                            'Quantity must be a positive whole number',
                            400,
                            'INVALID_QUANTITY'
                        );
                    }

                    if (
                        !Number.isFinite(unitPrice) ||
                        unitPrice < 0
                    ) {
                        throw new AppError(
                            'Unit price must be a valid non-negative amount',
                            400,
                            'INVALID_UNIT_PRICE'
                        );
                    }

                    if (
                        !Number.isFinite(discountPercentage) ||
                        discountPercentage < 0 ||
                        discountPercentage > 100
                    ) {
                        throw new AppError(
                            'Discount percentage must be between 0 and 100',
                            400,
                            'INVALID_DISCOUNT'
                        );
                    }

                    const totalPrice = unitPrice * quantity;
                    const discountAmount =
                        totalPrice * discountPercentage / 100;
                    const amount = totalPrice - discountAmount;

                    subtotal += totalPrice;
                    total += amount;

                    return {
                        product,
                        item_number: index + 1,
                        item_name: itemName,
                        quantity,
                        unit_price: unitPrice,
                        total_price: totalPrice,
                        discount_percentage: discountPercentage,
                        discount_amount: discountAmount,
                        amount
                    };
                }
            );

            const paidAmount = Number(invoiceData.paid_amount || 0);
            if (!Number.isFinite(paidAmount) || paidAmount < 0) {
                throw new AppError(
                    'Paid amount must be a valid non-negative amount',
                    400,
                    'INVALID_PAID_AMOUNT'
                );
            }

            if (paidAmount > total) {
                throw new AppError(
                    'Paid amount cannot be greater than bill total',
                    400,
                    'PAID_AMOUNT_EXCEEDS_TOTAL'
                );
            }

            for (const {
                product,
                availableQuantity,
                requestedQuantity
            } of products.values()) {
                await product.update(
                    {
                        stock_quantity:
                            availableQuantity - requestedQuantity
                    },
                    { transaction }
                );
            }

            await invoiceRepository.deleteItemsByInvoiceId(
                invoice.id,
                transaction
            );

            await invoice.update(
                {
                    kilometer: invoiceData.kilometer,
                    service_datetime:
                        invoiceData.service_datetime ||
                        invoice.service_datetime,
                    sub_total: subtotal,
                    total,
                    payment_type:
                        invoiceData.payment_type ||
                        invoice.payment_type,
                    paid_amount: paidAmount,
                    balance_amount: total - paidAmount
                },
                { transaction }
            );

            for (const item of calculatedItems) {
                await invoiceRepository.createItem(
                    {
                        invoice_id: invoice.id,
                        product_id: item.product?.id || null,
                        item_number: item.item_number,
                        item_name: item.item_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                        discount_percentage:
                            item.discount_percentage,
                        discount_amount: item.discount_amount,
                        amount: item.amount
                    },
                    transaction
                );
            }

            await transaction.commit();

            return await invoiceRepository.findById(invoice.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }


    async getAllInvoices() {

        return await invoiceRepository.findAll();
    }


    async getInvoiceById(id) {

        const invoice =
            await invoiceRepository.findById(id);

        if (!invoice) {
            throw new AppError(
                'Invoice not found',
                404,
                'INVOICE_NOT_FOUND'
            );
        }

        return invoice;
    }
}

module.exports = new InvoiceService();