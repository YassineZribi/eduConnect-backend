const Joi = require('@hapi/joi');
// make schema for Validation before save data in database:
const updateMainPhoneNumber = (reqBody) => {
    const schema = Joi.object({
        mainPhoneNumber: Joi.string().pattern(new RegExp('^[0-9]*$')).length(8).empty().required().messages({
            "string.base": `"phoneNumber" should be a type of 'text'`,
            "string.pattern": `"phoneNumber" must contain only numbers`,
            "string.length": `"phoneNumber" must have exactly 8 numbers`,
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"phoneNumber" is a required field`
        })

    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

const updateOptionalPhoneNumber = (reqBody) => {
    const schema = Joi.object({
        optionalPhoneNumber: Joi.string().pattern(new RegExp('^[0-9]*$')).length(8).allow('').required().messages({
            "string.base": `"phoneNumber" should be a type of 'text'`,
            "string.pattern": `"phoneNumber" must contain only numbers`,
            "string.length": `"phoneNumber" must have exactly 8 numbers`,
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"phoneNumber" is a required field`
        })

    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

module.exports = { updateMainPhoneNumber, updateOptionalPhoneNumber };
