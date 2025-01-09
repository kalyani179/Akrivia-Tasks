const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  dob: Joi.date().required(),
  course: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };