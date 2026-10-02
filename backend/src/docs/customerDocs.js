/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Customer management
 */

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create customer
 *     tags: [Customers]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - contact_number
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: Arun Kumar
 *               contact_number:
 *                 type: string
 *                 example: "9876543210"
 *
 *     responses:
 *       201:
 *         description: Customer created successfully
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 */
