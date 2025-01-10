/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: Registered email address
 *         password:
 *           type: string
 *           description: Account password
 *       example:
 *         email: john.doe@example.com
 *         password: password123
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to an existing account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful login, returns a JWT token
 *       400:
 *         description: Validation error or invalid credentials
 *       500:
 *         description: Internal server error
 */

module.exports = {}; // Required for import
