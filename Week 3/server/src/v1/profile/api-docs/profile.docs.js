/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: The user's ID
 *         username:
 *           type: string
 *           description: The user's username
 *         email:
 *           type: string
 *           description: The user's email
 *         profile_image:
 *           type: string
 *           description: URL of the user's profile image
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 * 
 *     PresignedUrlResponse:
 *       type: object
 *       properties:
 *         uploadUrl:
 *           type: string
 *           description: The presigned URL for uploading the file
 *         imageUrl:
 *           type: string
 *           description: The permanent URL where the image will be accessible after upload
 * 
 *     FileMetadata:
 *       type: object
 *       properties:
 *         fileUrl:
 *           type: string
 *           description: The URL where the file is stored
 *         fileName:
 *           type: string
 *           description: Original name of the file
 *         fileType:
 *           type: string
 *           description: MIME type of the file
 * 
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /api/profile/generate-presigned-url:
 *   post:
 *     summary: Generate a presigned URL for file upload
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name of the file to be uploaded
 *               fileType:
 *                 type: string
 *                 description: MIME type of the file
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresignedUrlResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /api/profile/save-file-metadata:
 *   post:
 *     summary: Save metadata for an uploaded file
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FileMetadata'
 *     responses:
 *       200:
 *         description: File metadata saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File metadata saved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

module.exports = {
  // This export is optional, but can be useful if you want to reuse these schemas elsewhere
  schemas: {
    Profile: {
      type: 'object',
      properties: {
        user_id: { type: 'integer' },
        username: { type: 'string' },
        email: { type: 'string' },
        profile_image: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    },
    PresignedUrlResponse: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string' },
        imageUrl: { type: 'string' }
      }
    },
    FileMetadata: {
      type: 'object',
      properties: {
        fileUrl: { type: 'string' },
        fileName: { type: 'string' },
        fileType: { type: 'string' }
      }
    }
  }
};
