"registerTeamMemberValidation";
const Joi = require("@hapi/joi");
// make schema for Validation before save data in database:
const updateTeamMemberProfileValidation = (reqBody) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).max(20).empty().required().messages({
            "string.base": "\"firstName\" should be a type of 'text'",
            "string.min": "\"firstName\" should have a minimum length of 3 ", // {#limit}
            "string.max": "\"firstName\" should have a maximum length of 20", // {#limit}
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"firstName\" is a required field"
        }),
        lastName: Joi.string().min(3).max(20).empty().required().messages({
            "string.base": "\"lastName\" should be a type of 'text'",
            "string.min": "\"lastName\" should have a minimum length of 3 ", // {#limit}
            "string.max": "\"lastName\" should have a maximum length of 20", // {#limit}
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"lastName\" is a required field"
        }),
        nationalIdCard: Joi.string().pattern(new RegExp("^[0-9]*$")).length(8).empty().required().messages({
            "string.base": "\"nationalIdCard\" should be a type of 'text'",
            "string.pattern": "\"nationalIdCard\" must contain only numbers",
            "string.length": "\"nationalIdCard\" must have exactly 8 numbers",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"nationalIdCard\" is a required field"
        }),
        governorate: Joi.string().empty().required().messages({     //  should be a select box
            "string.base": "\"accountName\" should be a type of 'text'",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"accountName\" is a required field"
        })

    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

const updatephoneNumberValidation = (reqBody) => {
    const schema = Joi.object({
        phoneNumber: Joi.string().pattern(new RegExp("^(\\+216)[0-9]{8}$")).length(12).empty().required().messages({
            "string.base": "\"phoneNumber\" should be a type of 'text'",
            "string.pattern": "\"phoneNumber\" must contain only numbers",
            "string.length": "\"phoneNumber\" must have exactly 8 numbers",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"phoneNumber\" is a required field"
        })

    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

const updatePasswordValidation = (reqBody) => {
    const schema = Joi.object({
        currentPassword: Joi.string().empty().required().messages({
            "string.base": "\"accountName\" should be a type of 'text'",
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"accountName\" is a required field"
        }),
        newPassword: Joi.string().min(6).max(30).empty().required().messages({
            "string.base": "\"accountName\" should be a type of 'text'",
            "string.empty": "Ce champ doit être rempli !",
            "string.min": "\"newPassword\" should have a minimum length of 6 ",
            "string.max": "\"accountName\" should have a maximum length of 30",
            "any.required": "\"accountName\" is a required field"
        })
    });
    return schema.validate(reqBody, { abortEarly: false });
};


const updateStatusValidation = (reqBody) => {
    const schema = Joi.object({
        status: Joi.array().min(1).items(Joi.string().min(3).max(20).empty().required().messages({
            "string.base": "\"status\" should be a type of 'text'",
            "string.min": "\"status\" should have a minimum length of 3 ", // {#limit}
            "string.max": "\"status\" should have a maximum length of 20", // {#limit}
            "string.empty": "Ce champ doit être rempli !",
            "any.required": "\"status\" is a required field"
        }))
    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

const updateTeachingLevelValidation = (reqBody) => {
    const schema = Joi.object({
        teachingLevel: Joi.string().pattern(new RegExp("^[3-5]*$")).length(1).allow("").messages({
            "string.base": "\"accountName\" should be a type of 'text'"
        })
    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

module.exports = { updateTeamMemberProfileValidation, updatephoneNumberValidation, updatePasswordValidation, updateStatusValidation, updateTeachingLevelValidation };
