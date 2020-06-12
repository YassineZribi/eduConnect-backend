const Joi = require("@hapi/joi");
// make schema for Validation before save data in database:
const loginValidation = (reqBody) => {
    const schema = Joi.object({
        phoneNum: Joi.string().pattern(new RegExp("^(\\+216)[0-9]{8}$")).length(12).empty().required().messages({
            "string.base": "\"phoneNumber\" should be a type of 'text'",
            "string.pattern": "\"phoneNumber\" must contain only numbers",
            "string.length": "\"phoneNumber\" must have exactly 8 numbers",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"phoneNumber\" is a required field"
        }),
        password: Joi.string().empty().required().messages({
            "string.base": "\"accountName\" should be a type of 'text'",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"accountName\" is a required field"
        })
    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};



module.exports = loginValidation;
