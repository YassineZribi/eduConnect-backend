const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Parent = require("../../models/Parent");
const Bill = require("../../models/Bill");
const TeamMember = require("../../models/TeamMember");
const registerParentValidation = require("../validations/registerParentValidation");
const { updateParentProfilValidationByManager, updateParentProfilValidationByHim, updateMainPhoneNumber, updateOptionalPhoneNumber, updatePasswordValidation } = require("../validations/updateParentValidation");
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const checkForHexRegExpFunction = require("../validations/checkMongodbIdValidity");
require("dotenv").config();


// @route   *** GET /users ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("User route");
});


// @route   *** POST /users ***
// @desc    *** Register parent ***
// @access  *** Public ***
router.post("/parent", async (req, res) => {
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
        const parentExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": phoneNumbers.mainPhoneNumber, childhoodInstitution: childhoodInstitution });
        if (parentExists) return res.status(400).json({ errorMsg: "User already exists" });

        const teamMemberExists = await TeamMember.findOne({ phoneNumber: phoneNumbers.mainPhoneNumber, childhoodInstitution: childhoodInstitution });
        if (teamMemberExists) return res.status(400).json({ errorMsg: "User already exists" });

        const { father, mother, location, governorate, children, password } = req.body;

        // Create an instance of a User
        const parent = new Parent({
            father: {
                firstName: father.firstName,
                lastName: father.lastName,
                nationalIdCard: father.nationalIdCard
            },
            mother: {
                firstName: mother.firstName,
                lastName: mother.lastName,
                nationalIdCard: mother.nationalIdCard
            },
            accountName: mother.firstName.concat(" ", mother.lastName), //*Salma Kallel*  // Mohamed Zribi   //Salma Kallel Zribi   // Salma ~ Mohamed   // Salma ~ Mohamed Zribi    // Famille Zribi  
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
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: "Server error was occured!!!" });

    }


});


// @route   *** PUT /users ***
// @desc    *** Update parent profile ***
// @access  *** Private (only for manager) ***
router.put("/up_parent_profile_by_manager/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVisible: true, isVerified: true });
            // if a parent is not found 
            if (!parent) return res.status(404).json({ errorMsg: "Can not find User" });
            // else
            const { error, value } = updateParentProfilValidationByManager(req.body);
            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }

            const { father, mother, accountName, children } = req.body;

            // Build profileobject
            const updateParentFields = {
                father: {
                    firstName: father.firstName,
                    lastName: father.lastName,
                    nationalIdCard: father.nationalIdCard
                },
                mother: {
                    firstName: mother.firstName,
                    lastName: mother.lastName,
                    nationalIdCard: mother.nationalIdCard
                },
                accountName,
                children
            };

            // we're ready to update it in the db


            parent = await Parent.findOneAndUpdate({ _id: req.params.parentId, childhoodInstitution }, { $set: updateParentFields }, { new: true });
            return res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handling access)" });


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});


// @route   *** PUT /users ***
// @desc    *** Update parent profile ***
// @access  *** Private (only  the parent himself) ***
router.put("/up_parent_profile_by_him", authPrivRoutes, async (req, res) => {
    try {
        let parent = await Parent.findOne({ _id: req.user.id, isVisible: true, isVerified: true });
        if (!parent) return res.status(404).json({ errorMsg: "Can not update profil because we can not find User with this id" });
        const { error, value } = updateParentProfilValidationByHim(req.body);
        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { location, governorate } = req.body;

        // Build profileobject
        const updateParentFields = {
            location,
            governorate
        };

        // we're ready to update it in the db

        parent = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: updateParentFields }, { new: true });
        return res.json(parent);
    }

    catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});


// @route   *** PUT /users ***
// @desc    *** Update mainPhoneNumber ***
// @access  *** Private (only  the parent himself) ***
router.put("/phonenumbers/main", authPrivRoutes, async (req, res) => {
    try {
        const parent = await Parent.findOne({ _id: req.user.id, isVisible: true, isVerified: true });
        if (!parent) return res.status(404).json({ errorMsg: "Can not find User with this id" });
        const { error, value } = updateMainPhoneNumber(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { mainPhoneNumber } = req.body;


        const mainPhoneNumberExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": mainPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

        if (mainPhoneNumberExists) return res.status(400).json({ errorMsg: "mainPhoneNumber already exists" });
        //Testes le après avoir ajouter des instanciations du modèle TeamMember

        const PhoneNumberTeamMember = await TeamMember.findOne({ phoneNumber: mainPhoneNumber, childhoodInstitution: req.user.childhoodInstitution });

        if (PhoneNumberTeamMember) return res.status(400).json({ errorMsg: "mainPhoneNumber already exists" });


        const me = await Parent.findOne({ _id: req.user.id });
        if (me && me.phoneNumbers.mainPhoneNumber === mainPhoneNumber) return res.status(400).json({ msg: "Your phone number has not been changed" });
        if (me && me.phoneNumbers.optionalPhoneNumber === mainPhoneNumber) return res.status(400).json({ msg: `the number entered ${mainPhoneNumber} represents your optional number.` });
        // me.phoneNumbers.mainPhoneNumber = mainPhoneNumber;
        // await me.save()  // method of ahmed
        const newMainPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { "phoneNumbers.mainPhoneNumber": mainPhoneNumber } }, { new: true });
        res.json(newMainPhoneNumber);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});


// @route   *** PUT /users ***
// @desc    *** Update optionalPhoneNumber ***
// @access  *** Private (only the parent himself) ***
router.put("/phonenumbers/optional", authPrivRoutes, async (req, res) => {
    try {
        const parent = await Parent.findOne({ _id: req.user.id, isVisible: true, isVerified: true });
        if (!parent) return res.status(404).json({ errorMsg: "Can not find User with this id" });
        const { error, value } = updateOptionalPhoneNumber(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { optionalPhoneNumber } = req.body;


        const optionalPhoneNumberExists = await Parent.findOne({ "phoneNumbers.optionalPhoneNumber": optionalPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

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
        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { "phoneNumbers.optionalPhoneNumber": optionalPhoneNumber } }, { new: true });
        res.json(newOptionalPhoneNumber);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }



});


// @route   *** PUT /users ***
// @desc    *** delete optionalPhoneNumber (çad "") ***
// @access  *** Private (only the parent himself)***
router.put("/phonenumbers/deleteoptional", authPrivRoutes, async (req, res) => {
    try {
        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id, isVisible: true, isVerified: true }, { $set: { "phoneNumbers.optionalPhoneNumber": "" } }, { new: true });
        if (!newOptionalPhoneNumber) return res.status(404).json({ errorMsg: "Can not find User with this id" });
        res.json(newOptionalPhoneNumber);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});


// @route   *** PUT /users ***
// @desc    *** make an exchange between the 2 phoneNumbers ***
// @access  *** Private (only the parent himself)***
router.put("/phonenumbers/exchange", authPrivRoutes, async (req, res) => {
    try {
        const me = await Parent.findOne({ _id: req.user.id, isVisible: true, isVerified: true });
        if (!me) return res.status(404).json({ errorMsg: "Can not find this user" });
        const { mainPhoneNumber, optionalPhoneNumber } = me.phoneNumbers;
        if (optionalPhoneNumber === "") return res.status(400).json({ errorMsg: "we cannot put the main number empty" });

        let optionalPhoneNumberExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": optionalPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });
        if (optionalPhoneNumberExists) return res.status(400).json({ errorMsg: `${optionalPhoneNumber} already exists as mainPhoneNumber for another user` });

        optionalPhoneNumberExists = await TeamMember.findOne({ phoneNumber: optionalPhoneNumber, childhoodInstitution: req.user.childhoodInstitution });
        if (optionalPhoneNumberExists) return res.status(400).json({ errorMsg: `${optionalPhoneNumber} already exists as mainPhoneNumber for another user` });

        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { "phoneNumbers.optionalPhoneNumber": mainPhoneNumber, "phoneNumbers.mainPhoneNumber": optionalPhoneNumber } }, { new: true });
        res.json(newOptionalPhoneNumber);


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }



});


// @route   *** PUT /users ***
// @desc    *** mofidy password ***
// @access  *** Private (only the parent himself) ***
router.put("/modify_password", authPrivRoutes, async (req, res) => {
    try {
        const parent = await Parent.findOne({ _id: req.user.id, isVisible: true, isVerified: true });
        if (!parent) return res.status(404).json({ errorMsg: "Can not find User with this id" });
        const { error, value } = updatePasswordValidation(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { currentPassword, newPassword } = req.body;
        // checking if the password entered and the user password saved in the databse are equal
        const isMatch = await bcrypt.compare(currentPassword, parent.password);
        if (!isMatch) return res.status(401).json({ errorMsg: "Invalid current password" });


        if (currentPassword === newPassword) return res.status(400).json({ msg: "You kept the old password!" });

        // before saving our newPassword in the db, we must encrypt it (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        const newPassEncrypted = await bcrypt.hash(newPassword, salt);

        const userAfterChangingPassword = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { password: newPassEncrypted } }, { new: true });
        res.json(userAfterChangingPassword);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});


// @route   *** PUT /users ***
// @desc    *** update isVerified field to true ***
// @access  *** Private (only for manager)***
router.put("/update_isverified_field/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOneAndUpdate({ _id: req.params.parentId, childhoodInstitution, isVisible: true, isVerified: false }, { $set: { isVerified: true } }, { new: true });
            if (!parent) return res.status(404).json({ errorMsg: "Can not find User" });

            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});

// @route   *** PUT /users ***
// @desc    *** update isVisible field to false ***
// @access  *** Private (only for manager)***
router.put("/update_isvisible_field/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOneAndUpdate({ _id: req.params.parentId, childhoodInstitution, isVisible: true }, { $set: { isVisible: false } }, { new: true });
            if (!parent) return res.status(404).json({ errorMsg: "Can not find User" });
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});


// @route   *** GET /users ***
// @desc    *** Get all verified parents by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/all_verified_parents/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const parents = await Parent.find({ childhoodInstitution, isVerified: true, isVisible: true }, "-password -__v");
            if (parents.length === 0) return res.status(404).json({ errorMsg: "there are no users available at the moment" });
            res.json(parents);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});


// @route   *** GET /users ***
// @desc    *** Get all Not Verified parents yet by childhoodInstitution  ***
// @access  *** Private (only for manager)  ***
router.get("/parents_notverified_yet/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const parents = await Parent.find({ childhoodInstitution, isVerified: false, isVisible: true }, "-password -__v");
            if (parents.length === 0) return res.status(404).json({ errorMsg: "there are no unverified users available at the moment" });
            // console.log(parents);
            res.json(parents);
        } else return res.status(403).json({ accessError: "Can not access this data (handling access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /users ***
// @desc    *** Get one verified & visible parent by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/one_verified_parent/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVerified: true, isVisible: true }, "-password -__v");
            if (!parent) return res.status(404).json({ errorMsg: " Can not find User" });
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /users ***
// @desc    *** Get one parent not verified yet by childhoodInstitution ***
// @access  *** Private for TeamMembers (only for manager) ***
router.get("/one_parent_not_verified_yet/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        // access only for TeamMembers
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVerified: false, isVisible: true }, "-password -__v");
            if (!parent) return res.status(404).json({ errorMsg: " Can not find User" });
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /users ***
// @desc    *** Get all children of verified parents by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/all_children/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            let parents = await Parent.find({ childhoodInstitution, isVerified: true, isVisible: true }, "children avatar");
            if (parents.length === 0) return res.status(404).json({ errorMsg: "there are no children to show because there are no verified parents subscribed in this childhood Institution" });
            parents = parents.map(parent => parent.toJSON());

            // second method:
            /*
            for (let i = 0; i < parents.length; i++) {
                for (let j = 0; j < parents[i].children.length; j++) {
                    parents[i].children[j] = { ...parents[i].children[j], avatar: parents[i].avatar, parentId: parents[i]._id };
                }
            }
            childrens = parents.map(par => par.children).reduce((acc, cV) => [...acc, ...cV], []);
            */


            // first method
            const childrens = parents.map(parent => ({
                ...parent,
                children: parent.children.map(child => ({
                    ...child,
                    avatar: parent.avatar,
                    parentId: parent._id
                }))
            })).map(par => par.children).reduce((acc, cV) => [...acc, ...cV], []);


            res.json(childrens);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});







module.exports = router;


/*
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

*/