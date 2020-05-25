const Joi = require('@hapi/joi');
// make schema for Validation before save data in database:
const updateParentProfilValidationByManager = (reqBody) => {
    const schema = Joi.object({
        father: Joi.object({
            firstName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"firstName" should be a type of 'text'`,
                "string.min": `"firstName" should have a minimum length of 3 `, // {#limit}
                "string.max": `"firstName" should have a maximum length of 20`, // {#limit}
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"firstName" is a required field`
            }),
            lastName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"lastName" should be a type of 'text'`,
                "string.min": `"lastName" should have a minimum length of 3 `, // {#limit}
                "string.max": `"lastName" should have a maximum length of 20`, // {#limit}
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"lastName" is a required field`
            }),
            nationalIdCard: Joi.string().pattern(new RegExp('^[0-9]*$')).length(8).empty().required().messages({
                "string.base": `"nationalIdCard" should be a type of 'text'`,
                "string.pattern": `"nationalIdCard" must contain only numbers`,
                "string.length": `"nationalIdCard" must have exactly 8 numbers`,
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"nationalIdCard" is a required field`
            })
        }),
        mother: Joi.object({
            firstName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"firstName" should be a type of 'text'`,
                "string.min": `"firstName" should have a minimum length of 3 `, // {#limit}
                "string.max": `"firstName" should have a maximum length of 20`, // {#limit}
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"firstName" is a required field`
            }),
            lastName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"lastName" should be a type of 'text'`,
                "string.min": `"lastName" should have a minimum length of 3 `, // {#limit}
                "string.max": `"lastName" should have a maximum length of 20`, // {#limit}
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"lastName" is a required field`
            }),
            nationalIdCard: Joi.string().pattern(new RegExp('^[0-9]*$')).length(8).empty().required().messages({
                "string.base": `"nationalIdCard" should be a type of 'text'`,
                "string.pattern": `"nationalIdCard" must contain only numbers`,
                "string.length": `"nationalIdCard" must have exactly 8 numbers`,
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"nationalIdCard" is a required field`
            })
        }),
        accountName: Joi.string().min(6).max(50).empty().required().messages({
            "string.base": `"accountName" should be a type of 'text'`,
            "string.min": `"accountName" should have a minimum length of 3 `, // {#limit}
            "string.max": `"accountName" should have a maximum length of 20`, // {#limit}
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"accountName" is a required field`
        }),
        children: Joi.array().min(1).items(Joi.object({
            firstName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"firstName" should be a type of 'text'`,
                "string.min": `"firstName" should have a minimum length of 3 `, // {#limit}
                "array.min": `Vous devez avoir au moins 1 enfant à inscrire `, // {#limit} non encore tester (peut etre blasetha 8alta)
                "string.max": `"firstName" should have a maximum length of 20`, // {#limit}
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"firstName" is a required field`
            }),
            lastName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"lastName" should be a type of 'text'`,
                "string.min": `"lastName" should have a minimum length of 3 `, // {#limit}
                "string.max": `"lastName" should have a maximum length of 20`, // {#limit}
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"lastName" is a required field`
            }),
            dateOfBirth: Joi.date().empty().required().messages({
                "any.empty": `Ce champ doit être rempli !`,
                "any.required": `"firstName" is a required field`
            }),
            levelOfStudy: Joi.string().empty().required().messages({     //  should be a select box
                "string.base": `"accountName" should be a type of 'text'`,
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"accountName" is a required field`
            }),
            gender: Joi.string().empty().required().messages({
                "string.base": `"gender" should be a type of 'text'`,
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"gender" is a required field`
            })
        }))

    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};


const updateParentProfilValidationByHim = (reqBody) => {
    const schema = Joi.object({
        location: Joi.string().max(40).empty().required().messages({
            "string.base": `"username" should be a type of 'text'`,
            "string.max": `"username" should have a maximum length of 40 characters`, // {#limit}
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"username" is a required field`
        }),
        governorate: Joi.string().empty().required().messages({     //  should be a select box
            "string.base": `"username" should be a type of 'text'`,
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"username" is a required field`
        })
    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};


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


const updatePasswordValidation = (reqBody) => {
    const schema = Joi.object({
        currentPassword: Joi.string().empty().required().messages({
            "string.base": `"accountName" should be a type of 'text'`,
            "string.empty": `Ce champ doit être rempli !`,
            "any.required": `"accountName" is a required field`
        }),
        newPassword: Joi.string().min(6).max(30).empty().required().messages({
            "string.base": `"accountName" should be a type of 'text'`,
            "string.empty": `Ce champ doit être rempli !`,
            "string.min": `"newPassword" should have a minimum length of 6 `,
            "string.max": `"accountName" should have a maximum length of 30`,
            "any.required": `"accountName" is a required field`
        })
    });
    return schema.validate(reqBody, { abortEarly: false });
};

module.exports = { updateParentProfilValidationByManager, updateParentProfilValidationByHim, updateMainPhoneNumber, updateOptionalPhoneNumber, updatePasswordValidation };
