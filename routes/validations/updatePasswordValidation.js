const Joi = require('@hapi/joi');
// make schema for Validation before save data in database:
const updatePasswordValidation = (reqBody) => {
    const schema = Joi.object({
        currentPassword: Joi.string().empty().required().messages({
            "string.base": `"username" should be a type of 'text'`,
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"username" is a required field`
        }),
        newPassword: Joi.string().min(6).max(30).empty().required().messages({
            "string.base": `"username" should be a type of 'text'`,
            "string.empty": `Ce champ doit être rempli !`,
            "string.min": `"newPassword" should have a minimum length of 6 `,
            "string.max": `"username" should have a maximum length of 30`,
            "any.required": `"username" is a required field`
        })
    });
    return schema.validate(reqBody, { abortEarly: false });
};

module.exports = updatePasswordValidation;
