/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Single administrator account and session management
 */

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check whether the one administrator account exists
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Account availability
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create the first and only administrator account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 maxLength: 64
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 64
 *     responses:
 *       201:
 *         description: Administrator created and signed in
 *       409:
 *         description: Administrator already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Sign in as the administrator
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session cookie issued
 *       401:
 *         description: Invalid username or password
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Invalidate the current administrator session
 *     tags: [Authentication]
 *     security:
 *       - adminSession: []
 *     responses:
 *       200:
 *         description: Session invalidated
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the current administrator session
 *     tags: [Authentication]
 *     security:
 *       - adminSession: []
 *     responses:
 *       200:
 *         description: Current administrator
 *       401:
 *         description: Authentication required
 */
