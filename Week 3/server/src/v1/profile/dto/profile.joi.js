const Joi = require('joi');

const profileUpdateSchema = Joi.object({
  username: Joi.string().min(3).max(255),
  email: Joi.string().email().max(255)
}).min(1);

const validateProfileUpdate = (data) => {
  return profileUpdateSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateProfileUpdate
};
