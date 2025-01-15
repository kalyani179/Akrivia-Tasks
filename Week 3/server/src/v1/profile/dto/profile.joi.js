const Joi = require('joi');

const profileUpdateSchema = Joi.object({
  username: Joi.string().min(3).max(255),
  email: Joi.string().email().max(255)
}).min(1);

const generatePresignedUrlSchema = Joi.object({
  fileName: Joi.string().required()
});

const saveFileMetadataSchema = Joi.object({
  fileUrl: Joi.string().required(),
  fileName: Joi.string().required()
});

module.exports = {
  profileUpdateSchema,
  generatePresignedUrlSchema,
  saveFileMetadataSchema
};
