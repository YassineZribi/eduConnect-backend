const Joi = require("@hapi/joi");
// make schema for Validation before save data in database:
const createPostValidation = (reqBody) => {
    const schema = Joi.object({
        text: Joi.string().empty().required().allow("").messages({
            "string.base": "\"email\" should be a type of 'text'",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"email\" is a required field"
        })
    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

module.exports = createPostValidation;
