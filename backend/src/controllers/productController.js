const productService = require('../services/productsService');

class ProductController {

    async create(req, res, next) {
        try {
            const product =
                await productService.createProduct(req.body);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });
        } catch (error) {
            next(error);
        }
    }


    async getAll(req, res, next) {
        try {
            const products =
                await productService.getAllProducts();

            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const product =
                await productService.updateProduct(
                    req.params.id,
                    req.body
                );

            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: product
            });
        } catch (error) {
            next(error);
        }
    }


    async delete(req, res, next) {
        try {
            await productService.deleteProduct(
                req.params.id
            );

            res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }


    async addStock(req, res, next) {
        try {
            const product =
                await productService.adjustStock(
                    req.params.id,
                    req.body.quantity,
                    req.body.direction || 'add'
                );

            res.status(200).json({
                success: true,
                message: 'Stock updated successfully',
                data: product
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();