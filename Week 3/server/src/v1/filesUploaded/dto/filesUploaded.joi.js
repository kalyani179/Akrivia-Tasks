const Joi = require('joi');

const generatePresignedUrlSchema = Joi.object({
  fileName: Joi.string().required()
});

const saveFileMetadataSchema = Joi.object({ 
  fileUrl: Joi.string().required(),
  fileName: Joi.string().required()
});

const downloadFilesSchema = Joi.object({
  fileUrls: Joi.array().items(Joi.string().required()).required()
});

const listFilesSchema = Joi.object({    
  fileUrls: Joi.array().items(Joi.string().required()).required()
});


module.exports = {
  generatePresignedUrlSchema,
  saveFileMetadataSchema,
  downloadFilesSchema,
  listFilesSchema
};

