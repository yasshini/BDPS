const productRepository = require('../repositories/productRepository');
const AppError = require('../errors/AppError');

class ProductService {

    async createProduct(productData) {

        const existingProduct =
            await productRepository.findByName(productData.item_name);

        if (existingProduct) {
            throw new AppError(
                'Product with this name already exists',
                409,
                'PRODUCT_ALREADY_EXISTS'
            );
        }

        if (productData.default_price < 0) {
            throw new AppError(
                'Product price cannot be negative',
                400,
                'INVALID_PRODUCT_PRICE'
            );
        }

        if (
            productData.stock_quantity !== undefined &&
            productData.stock_quantity < 0
        ) {
            throw new AppError(
                'Stock quantity cannot be negative',
                400,
                'INVALID_STOCK_QUANTITY'
            );
        }

        return await productRepository.create(productData);
    }


    async getAllProducts() {

        return await productRepository.findAll();
    }

    async updateProduct(id, productData) {

        const existingProduct =
            await productRepository.findById(id);

        if (!existingProduct) {
            throw new AppError(
                'Product not found',
                404,
                'PRODUCT_NOT_FOUND'
            );
        }

        if (productData.default_price !== undefined &&
            productData.default_price < 0) {

            throw new AppError(
                'Product price cannot be negative',
                400,
                'INVALID_PRODUCT_PRICE'
            );
        }

        if (productData.stock_quantity !== undefined &&
            productData.stock_quantity < 0) {

            throw new AppError(
                'Stock quantity cannot be negative',
                400,
                'INVALID_STOCK_QUANTITY'
            );
        }

        return await productRepository.update(
            id,
            productData
        );
    }


    async deleteProduct(id) {

        const product =
            await productRepository.delete(id);

        if (!product) {
            throw new AppError(
                'Product not found',
                404,
                'PRODUCT_NOT_FOUND'
            );
        }

        return product;
    }


    async adjustStock(id, quantity, direction = 'add') {

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new AppError(
                'Stock adjustment must be a positive whole number',
                400,
                'INVALID_STOCK_QUANTITY'
            );
        }

        if (!['add', 'remove'].includes(direction)) {
            throw new AppError(
                'Stock direction must be add or remove',
                400,
                'INVALID_STOCK_DIRECTION'
            );
        }

        const amount = direction === 'remove' ? -quantity : quantity;
        const { product, insufficientStock } =
            await productRepository.adjustStock(id, amount);

        if (!product) {
            throw new AppError(
                'Product not found',
                404,
                'PRODUCT_NOT_FOUND'
            );
        }

        if (insufficientStock) {
            throw new AppError(
                'Stock cannot be reduced below zero',
                400,
                'INSUFFICIENT_STOCK'
            );
        }

        return product;
    }

    async addStock(id, quantity) {
        return this.adjustStock(id, quantity, 'add');
    }
}

module.exports = new ProductService();