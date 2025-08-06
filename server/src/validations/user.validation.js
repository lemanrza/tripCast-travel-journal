const Joi = require("joi");
const userValidationSchema = Joi.object({
    email: Joi.string().email().required(),
    fullName: Joi.string().min(3).required(),
    profileImage: Joi.object({
        url: Joi.string().uri().required(),
        public_id: Joi.string().required(),
    }).optional(),
    premium: Joi.boolean().optional(),
    password: Joi.string().min(6).when("provider", {
        is: "local",
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    lists: Joi.array().optional(),
    journals: Joi.array().optional(),
    provider: Joi.string().valid("local", "google", "instagram").default("local"),
    providerId: Joi.string().allow(null, "").optional(),
    loginAttempts: Joi.number().min(0).optional(),
    lockUntil: Joi.date().optional(),
    isVerified: Joi.boolean().optional(),
});

module.exports = userValidationSchema;
