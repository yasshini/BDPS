const { Product } = require('../../models');

class ProductRepository {

    async create(productData) {
        return await Product.create(productData);
    }

    async findAll() {
        return await Product.findAll({
            where: {
                is_active: true
            },
            order: [['item_name', 'ASC']]
        });
    }

    async findById(id) {
        return await Product.findByPk(id);
    }

    async findByName(itemName) {
        return await Product.findOne({
            where: {
                item_name: itemName
            }
        });
    }

    async update(id, productData) {
        const product = await Product.findByPk(id);

        if (!product) {
            return null;
        }

        await product.update(productData);

        return product;
    }

    async delete(id) {
        const product = await Product.findByPk(id);

        if (!product) {
            return null;
        }

        // Soft delete
        await product.update({
            is_active: false
        });

        return product;
    }

    async adjustStock(id, amount) {
        return Product.sequelize.transaction(async (transaction) => {
            const product = await Product.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!product) {
                return { product: null, insufficientStock: false };
            }

            const currentStock = Number(product.stock_quantity);
            if (currentStock + amount < 0) {
                return { product, insufficientStock: true };
            }

            product.stock_quantity = currentStock + amount;
            await product.save({ transaction });

            return { product, insufficientStock: false };
        });
    }
}

module.exports = new ProductRepository();