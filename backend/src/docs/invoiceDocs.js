/**
 * @swagger
 * tags:
 *   - name: Invoices
 *     description: Bill and service management
 */

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create bill
 *     tags: [Invoices]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - bike_id
 *               - kilometer
 *               - payment_type
 *               - paid_amount
 *               - items
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *
 *               bike_id:
 *                 type: integer
 *                 example: 1
 *
 *               kilometer:
 *                 type: integer
 *                 example: 12500
 *
 *               service_datetime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-09-29T18:30:00Z"
 *
 *               payment_type:
 *                 type: string
 *                 example: CASH
 *
 *               paid_amount:
 *                 type: number
 *                 example: 570
 *
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       nullable: true
 *                       example: 1
 *                       description: Omit or set null for a custom service line
 *                     item_name:
 *                       type: string
 *                       example: Wheel alignment
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     unit_price:
 *                       type: number
 *                       example: 350
 *                     discount_percentage:
 *                       type: number
 *                       example: 5
 *
 *     responses:
 *       201:
 *         description: Bill created successfully
 *       400:
 *         description: Invalid bill data
 *       404:
 *         description: Customer, bike, or product not found
 *
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 */

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     summary: Update a bill and recalculate product stock
 *     tags: [Invoices]
 *
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kilometer
 *               - payment_type
 *               - paid_amount
 *               - items
 *             properties:
 *               kilometer:
 *                 type: integer
 *                 example: 12600
 *               payment_type:
 *                 type: string
 *                 example: CASH
 *               paid_amount:
 *                 type: number
 *                 example: 570
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                       nullable: true
 *                       example: 1
 *                       description: Omit or set null for a custom service line
 *                     item_name:
 *                       type: string
 *                       example: Wheel alignment
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     unit_price:
 *                       type: number
 *                       example: 300
 *                     discount_percentage:
 *                       type: number
 *                       example: 5
 *
 *     responses:
 *       200:
 *         description: Bill updated successfully
 *       400:
 *         description: Invalid bill data or insufficient stock
 *       404:
 *         description: Bill or product not found
 *
 *   get:
 *     summary: Get bill by ID
 *     tags: [Invoices]
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
 *         description: Invoice retrieved successfully
 *       404:
 *         description: Invoice not found
 */