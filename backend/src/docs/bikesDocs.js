/**
 * @swagger
 * tags:
 *   - name: Bikes
 *     description: Bike management
 */

/**
 * @swagger
 * /api/bikes:
 *   post:
 *     summary: Create a bike
 *     tags: [Bikes]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - bike_number
 *               - bike_model
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               bike_number:
 *                 type: string
 *                 example: TN58AB1234
 *               bike_model:
 *                 type: string
 *                 example: Honda Activa 6G
 *
 *     responses:
 *       201:
 *         description: Bike created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Bike already exists
 */

/**
 * @swagger
 * /api/bikes/number/{bikeNumber}:
 *   get:
 *     summary: Get bike by bike number
 *     tags: [Bikes]
 *
 *     parameters:
 *       - name: bikeNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: TN58AB1234
 *
 *     responses:
 *       200:
 *         description: Bike retrieved successfully
 *       404:
 *         description: Bike not found
 */
