/**
 * @swagger
 * components:
 *   schemas:
 *     PresignedUrlRequest:
 *       type: object
 *       required:
 *         - fileName
 *         - fileType
 *       properties:
 *         fileName:
 *           type: string
 *           description: Name of the file to be uploaded
 *         fileType:
 *           type: string
 *           description: MIME type of the file
 * 
 *     PresignedUrlResponse:
 *       type: object
 *       properties:
 *         uploadUrl:
 *           type: string
 *           description: The presigned URL for uploading the file
 *         fileUrl:
 *           type: string
 *           description: The permanent URL where the file will be accessible after upload
 * 
 *     FilesList:
 *       type: object
 *       properties:
 *         files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               file_id:
 *                 type: integer
 *                 description: Unique identifier for the file
 *               file_name:
 *                 type: string
 *                 description: Original name of the file
 *               file_url:
 *                 type: string
 *                 description: URL where the file is stored
 *               file_type:
 *                 type: string
 *                 description: MIME type of the file
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: When the file was uploaded
 * 
 *     DownloadRequest:
 *       type: object
 *       required:
 *         - fileIds
 *       properties:
 *         fileIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of file IDs to download
 * 
 * @swagger
 * /api/files/generate-upload-url:
 *   post:
 *     summary: Generate a presigned URL for file upload
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PresignedUrlRequest'
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
 * /api/files/list:
 *   get:
 *     summary: Get list of uploaded files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilesList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 * 
 * @swagger
 * /api/files/download:
 *   post:
 *     summary: Download multiple files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DownloadRequest'
 *     responses:
 *       200:
 *         description: Files downloaded successfully
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: One or more files not found
 *       500:
 *         description: Internal server error
 */

module.exports = {
  // Export schemas for reuse
  schemas: {
    PresignedUrlRequest: {
      type: 'object',
      required: ['fileName', 'fileType'],
      properties: {
        fileName: { type: 'string' },
        fileType: { type: 'string' }
      }
    },
    PresignedUrlResponse: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string' },
        fileUrl: { type: 'string' }
      }
    },
    FilesList: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file_id: { type: 'integer' },
              file_name: { type: 'string' },
              file_url: { type: 'string' },
              file_type: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    DownloadRequest: {
      type: 'object',
      required: ['fileIds'],
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'integer' }
        }
      }
    }
  }
};
