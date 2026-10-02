/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_name
 *               - default_price
 *               - stock_quantity
 *             properties:
 *               item_name:
 *                 type: string
 *                 example: Brake Oil
 *               default_price:
 *                 type: number
 *                 format: float
 *                 example: 300
 *               stock_quantity:
 *                 type: integer
 *                 example: 10
 *
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Product already exists
 *
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_name:
 *                 type: string
 *                 example: Brake Oil
 *               default_price:
 *                 type: number
 *                 format: float
 *                 example: 350
 *               stock_quantity:
 *                 type: integer
 *                 example: 15
 *
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *
 *   delete:
 *     summary: Delete product from active inventory
 *     tags: [Products]
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Product deleted from active inventory. Historical invoices are retained.
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Adjust product stock
 *     tags: [Products]
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               direction:
 *                 type: string
 *                 enum: [add, remove]
 *                 default: add
 *                 example: remove
 *
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid stock quantity
 *       404:
 *         description: Product not found
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'BDPS eBill API',
            version: '1.0.0',
            description: 'BDPS eBill API documentation'
        },

        servers: [
            {
                url: 'http://localhost:5000'
            }
        ]
    },

    apis: ['./src/docs/*.js']
};

module.exports = swaggerJsdoc(options);