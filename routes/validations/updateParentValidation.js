const Joi = require('@hapi/joi');
// make schema for Validation before save data in database:
const updateParentValidation = (reqBody) => {
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
            })
        }),
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
        }),
        children: Joi.array().min(1).items(Joi.object({
            firstName: Joi.string().min(3).max(20).empty().required().messages({
                "string.base": `"firstName" should be a type of 'text'`,
                "string.min": `"firstName" should have a minimum length of 3 `, // {#limit}
                // "array.min": `Vous devez avoir au moins 1 enfant à inscrire `, // {#limit} non encore tester
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
                "string.base": `"username" should be a type of 'text'`,
                "string.empty": `Ce champ doit être rempli !`,
                "any.required": `"username" is a required field`
            })
        }))

    });
    return schema.validate(reqBody, { abortEarly: false, allowUnknown: true });
};

module.exports = updateParentValidation;
