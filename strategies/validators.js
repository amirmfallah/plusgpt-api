const Joi = require("joi");

const loginSchema = Joi.object().keys({
  phone: Joi.string()
    .regex(/^09\d{9}$/)
    .trim()
    .length(11)
    .required(),
  password: Joi.string().trim().min(6).max(20).required(),
});

const registerSchema = Joi.object().keys({
  name: Joi.string().trim().min(2).max(30).required(),
  username: Joi.string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).max(20).required(),
  confirm_password: Joi.string().trim().min(6).max(20).required(),
  phone: Joi.string()
    .regex(/^09\d{9}$/)
    .trim()
    .length(11)
    .required(),
});

module.exports = {
  loginSchema,
  registerSchema,
};
