const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Parent = require('../../models/Parent');
const Bill = require('../../models/Bill');
const TeamMember = require('../../models/TeamMember');
const registerParentValidation = require('../validations/registerParentValidation');
const updateParentValidation = require('../validations/updateParentValidation');
const updatePasswordValidation = require('../validations/updatePasswordValidation');
const { updateMainPhoneNumber, updateOptionalPhoneNumber } = require('../validations/updatePhoneNumbers');
const authPrivRoutes = require('../../middleware/authPrivRoutes');
require('dotenv').config();


// @route   *** GET /users ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get('/test', (req, res) => {
    res.send('User route');
});


// @route   *** POST /users ***
// @desc    *** Register parent ***
// @access  *** Public ***
router.post('/parent', async (req, res) => {
    // Validate the data before registering the user (using @hapi/joi)
    const { error, value } = registerParentValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    try {
        // After validation => Checking if the user is already exist or not in the databse by checking his email
        const { phoneNumbers, childhoodInstitution } = req.body;
        const parentExists = await Parent.findOne({ 'phoneNumbers.mainPhoneNumber': phoneNumbers.mainPhoneNumber, childhoodInstitution: childhoodInstitution });
        if (parentExists) return res.status(400).json({ errorMsg: 'User already exists' });

        const teamMemberExists = await TeamMember.findOne({ phoneNumber: phoneNumbers.mainPhoneNumber, childhoodInstitution: childhoodInstitution });
        if (teamMemberExists) return res.status(400).json({ errorMsg: 'User already exists' });

        const { father, mother, location, governorate, children, password } = req.body;

        // Create an instance of a User
        const parent = new Parent({
            father: {
                firstName: father.firstName,
                lastName: father.lastName
            },
            mother: {
                firstName: mother.firstName,
                lastName: mother.lastName
            },
            phoneNumbers: {
                mainPhoneNumber: phoneNumbers.mainPhoneNumber,
                optionalPhoneNumber: phoneNumbers.optionalPhoneNumber
            },
            location,
            governorate,
            children,
            childhoodInstitution,
            password, // now this password is not encrypted yet

        });



        // before saving our instance in the db, we must encrypt password (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        parent.password = await bcrypt.hash(password, salt);
        // All right , now we can Interact with the database and register the user 
        await parent.save();


        // Return (sending back) jsonwebtoken once the user registered (the reason I'm reterning jwt is because in the front end when a user registers I want him to get logged in right away . and in order to logged in right away you must have that token)
        const payload = {
            user: {
                id: parent.id,
                childhoodInstitution: parent.childhoodInstitution
            }
        };
        jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log('error::', err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: 'Server error was occured!!!' });

    }


});


// @route   *** PUT /users ***
// @desc    *** Update User profile ***
// @access  *** Private ***
router.put('/', authPrivRoutes, async (req, res) => {
    const { error, value } = updateParentValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }

    const { father, mother, location, governorate, children } = req.body;

    // Build profileobject
    const updateParentFields = {
        father: {
            firstName: father.firstName,
            lastName: father.lastName
        },
        mother: {
            firstName: mother.firstName,
            lastName: mother.lastName
        },
        location,
        governorate,
        children
    };

    // we're ready to update it in the db

    try {
        const parent = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: updateParentFields }, { new: true });
        // if a parent is not found 
        if (!parent) return res.status(404).json({ errorMsg: "Can not found User" });
        // else, update profil
        return res.json(parent);


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }
});


// @route   *** PUT /users ***
// @desc    *** Update mainPhoneNumber ***
// @access  *** Private ***
router.put('/phonenumbers/main', authPrivRoutes, async (req, res) => {
    const { error, value } = updateMainPhoneNumber(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }

    const { mainPhoneNumber } = req.body;

    try {
        const mainPhoneNumberExists = await Parent.findOne({ 'phoneNumbers.mainPhoneNumber': mainPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

        if (mainPhoneNumberExists) return res.status(400).json({ errorMsg: "mainPhoneNumber already exists" });
        //Testes le après avoir ajouter des instanciations du modèle TeamMember

        const PhoneNumberTeamMember = await TeamMember.findOne({ phoneNumber: mainPhoneNumber, childhoodInstitution: req.user.childhoodInstitution });

        if (PhoneNumberTeamMember) return res.status(400).json({ errorMsg: "mainPhoneNumber already exists" });


        const me = await Parent.findOne({ _id: req.user.id });
        if (me && me.phoneNumbers.mainPhoneNumber === mainPhoneNumber) return res.status(400).json({ msg: "Your phone number has not been changed" });
        if (me && me.phoneNumbers.optionalPhoneNumber === mainPhoneNumber) return res.status(400).json({ msg: `the number entered ${mainPhoneNumber} represents your optional number.` });
        // me.phoneNumbers.mainPhoneNumber = mainPhoneNumber;
        // await me.save()  // method of ahmed
        const newMainPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { 'phoneNumbers.mainPhoneNumber': mainPhoneNumber } }, { new: true });
        res.json(newMainPhoneNumber);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }

});


// @route   *** PUT /users ***
// @desc    *** Update optionalPhoneNumber ***
// @access  *** Private ***
router.put('/phonenumbers/optional', authPrivRoutes, async (req, res) => {
    const { error, value } = updateOptionalPhoneNumber(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }

    const { optionalPhoneNumber } = req.body;

    try {
        const optionalPhoneNumberExists = await Parent.findOne({ 'phoneNumbers.optionalPhoneNumber': optionalPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

        if (optionalPhoneNumberExists) return res.status(400).json({ errorMsg: "optionalPhoneNumber already exists" });
        /* Test le après avoir ajouter des instanciations du modèle TeamMember
        
        const PhoneNumberTeamMember = await TeamMember.findOne({ phoneNumber: optionalPhoneNumber });

        if (PhoneNumberTeamMember) return res.status(400).json({ errorMsg: "optionalPhoneNumber already exists" });

        */
        const me = await Parent.findOne({ _id: req.user.id });
        if (me && me.phoneNumbers.optionalPhoneNumber === optionalPhoneNumber) return res.status(400).json({ msg: "Your phone number has not been changed" });
        if (me && me.phoneNumbers.mainPhoneNumber === optionalPhoneNumber) return res.status(400).json({ msg: `the number entered ${optionalPhoneNumber} represents your main number.` });

        // me.phoneNumbers.mainPhoneNumber = mainPhoneNumber;
        // await me.save()  // method of ahmed
        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { 'phoneNumbers.optionalPhoneNumber': optionalPhoneNumber } }, { new: true });
        res.json(newOptionalPhoneNumber);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }



});


// @route   *** PUT /users ***
// @desc    *** delete optionalPhoneNumber (çad "") ***
// @access  *** Private ***
router.put('/phonenumbers/deleteoptional', authPrivRoutes, async (req, res) => {
    /*
    const { error, value } = updateOptionalPhoneNumber(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    */
    try {
        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { 'phoneNumbers.optionalPhoneNumber': '' } }, { new: true });
        res.json(newOptionalPhoneNumber);
    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }



});


// @route   *** PUT /users ***
// @desc    *** make an exchange between the 2 phoneNumbers ***
// @access  *** Private ***
router.put('/phonenumbers/exchange', authPrivRoutes, async (req, res) => {
    try {
        /*
        const optionalPhoneNumberExists = await Parent.findOne({ 'phoneNumbers.optionalPhoneNumber': optionalPhoneNumber, _id: { $ne: req.user.id } });

        if (optionalPhoneNumberExists) return res.status(400).json({ errorMsg: "optionalPhoneNumber already exists" });
        */
        /* Test le après avoir ajouter des instanciations du modèle TeamMember
        
        const PhoneNumberTeamMember = await TeamMember.findOne({ phoneNumber: optionalPhoneNumber });

        if (PhoneNumberTeamMember) return res.status(400).json({ errorMsg: "optionalPhoneNumber already exists" });

        */

        const me = await Parent.findOne({ _id: req.user.id });
        if (!me) return res.status(404).json({ errorMsg: "Can not find this user" });
        const { mainPhoneNumber, optionalPhoneNumber } = me.phoneNumbers;
        if (optionalPhoneNumber === '') return res.status(400).json({ errorMsg: "we cannot put the main number empty" });

        let optionalPhoneNumberExists = await Parent.findOne({ 'phoneNumbers.mainPhoneNumber': optionalPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });
        if (optionalPhoneNumberExists) return res.status(400).json({ errorMsg: `${optionalPhoneNumber} already exists as mainPhoneNumber for another user` });

        optionalPhoneNumberExists = await TeamMember.findOne({ phoneNumber: optionalPhoneNumber, childhoodInstitution: req.user.childhoodInstitution });
        if (optionalPhoneNumberExists) return res.status(400).json({ errorMsg: `${optionalPhoneNumber} already exists as mainPhoneNumber for another user` });

        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { 'phoneNumbers.optionalPhoneNumber': mainPhoneNumber, 'phoneNumbers.mainPhoneNumber': optionalPhoneNumber } }, { new: true });
        res.json(newOptionalPhoneNumber);


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }



});


// @route   *** PUT /users ***
// @desc    *** mofidy password ***
// @access  *** Private ***
router.put('/modify_password', authPrivRoutes, async (req, res) => {
    const { error, value } = updatePasswordValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }

    try {
        const parent = await Parent.findOne({ _id: req.user.id });
        if (!parent) return res.status(400).json({ errorMsg: 'Can not found the user' });

        const { currentPassword, newPassword } = req.body;
        // checking if the password entered and the user password saved in the databse are equal
        const isMatch = await bcrypt.compare(currentPassword, parent.password);
        if (!isMatch) return res.status(401).json({ errorMsg: 'Invalid current password' });


        if (currentPassword === newPassword) return res.status(400).json({ msg: "You kept the old password!" });

        // before saving our newPassword in the db, we must encrypt it (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        newPassEncrypted = await bcrypt.hash(newPassword, salt);

        const userAfterChangingPassword = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { password: newPassEncrypted } }, { new: true });
        res.json(userAfterChangingPassword);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }

});


// @route   *** PUT /users ***
// @desc    *** update isVerified field to true ***
// @access  *** Private ***
router.put('/update_isverified_field', authPrivRoutes, async (req, res) => {

    try {
        const parent = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { isVerified: true } }, { new: true });
        if (!parent) return res.status(400).json({ errorMsg: 'Can not found the user' });
        res.json(parent);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }

});



// @route   *** GET /users ***
// @desc    *** Get all parents by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get('/', authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: 'Can not access this data' });
        // access only for TeamMembers
        const childhoodInstitution = req.user.childhoodInstitution;
        const parents = await Parent.find({ childhoodInstitution }, '-password -__v');
        // console.log(parents);
        res.json(parents);

    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }
});

router.get('/abcd', async (req, res) => {
    try {
        const bill = await Bill.findById('5ec9d9f7170a543a783b40c7');
        if (!bill) return res.status(403).json({ accessError: 'Can not access' });
        const date1 = bill.createdAt;
        const date2 = new Date();
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log(diffDays);
        res.json(bill);

    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }
});


module.exports = router;