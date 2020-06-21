const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Parent = require("../../models/Parent");
const Bill = require("../../models/Bill");
const TeamMember = require("../../models/TeamMember");
const registerParentValidation = require("../validations/registerParentValidation");
const { updateParentProfil, updateParentProfilValidationByHim, updateMainPhoneNumber, updateOptionalPhoneNumber, updatePasswordValidation } = require("../validations/updateParentValidation");
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const checkForHexRegExpFunction = require("../validations/checkMongodbIdValidity");
require("dotenv").config();


// @route   *** GET /users ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("User route Done");
});


// @route   *** POST /users ***  TODO: Done
// @desc    *** Register parent ***
// @access  *** Public ***
router.post("/create_parent/:childhoodInstitutionId", async (req, res) => {
    // Validate the data before registering the user (using @hapi/joi)
    const { error, value } = registerParentValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        // console.log('error.details: ', error.details);
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    try {
        // After validation => Checking if the user is already exist or not in the databse by checking his mainPhoneNumber
        const { phoneNumbers } = req.body;

        if (phoneNumbers.mainPhoneNumber === phoneNumbers.optionalPhoneNumber) return res.status(400).json({ errorCode: "01", title: "IMPORTANT !", alert: "Phone numbers should not be similar", alertType: "warning" });

        const teamMemberExists = await TeamMember.findOne({ phoneNumber: phoneNumbers.mainPhoneNumber, childhoodInstitution: req.params.childhoodInstitutionId });
        if (teamMemberExists) return res.status(400).json({ errorCode: "01", title: "IMPORTANT !", alert: "User already exists", alertType: "error" });

        const parentExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": phoneNumbers.mainPhoneNumber, childhoodInstitution: req.params.childhoodInstitutionId });
        if (parentExists) return res.status(400).json({ errorCode: "01", title: "IMPORTANT !", alert: "User already exists", alertType: "error" });



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
                optionalPhoneNumber: phoneNumbers.optionalPhoneNumber === "+216" ? "" : phoneNumbers.optionalPhoneNumber
            },
            location,
            governorate,
            children,
            childhoodInstitution: req.params.childhoodInstitutionId,
            password, // now this password is not encrypted yet

        });



        // before saving our instance in the db, we must encrypt password (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        parent.password = await bcrypt.hash(password, salt);
        // All right , now we can Interact with the database and register the user 
        await parent.save();

        // if (parent.isVisible && !parent.isAccepted && !parent.isAllowed) : (default case at registration)
        return res.json({ title: "Votre compte a été créé avec Succés", alert: "Pour des raisons de sécurité et pour protéger nos Enfants , tous les comptes nouvellement créés doivent être examiner avant d'avoir l'accès.  Vous receverez un message de confirmation sur votre numéro de téléphone:" + parent.phoneNumbers.mainPhoneNumber + "pour pouvoir y accéder. Merci pour votre compréhension.", alertType: "success" });




        // Return (sending back) jsonwebtoken once the user registered (the reason I'm reterning jwt is because in the front end when a user registers I want him to get logged in right away . and in order to logged in right away you must have that token)

        /*
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
        */


    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: "Server error was occured!!!" });

    }


});


// @route   *** PUT /users *** TODO: Done 
// @desc    *** Accept parent or animator  ***
// @access  *** Private (only for manager)***
router.put("/accept_user/:childhoodInstitutionId/:userId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.userId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let user = await TeamMember.findOneAndUpdate({ _id: req.params.userId, childhoodInstitution, status: { $in: ["animator"] }, isVisible: true, isAccepted: false, isAllowed: false }, { $set: { isAccepted: true, isAllowed: true } }, { new: true });
            if (!user) {
                user = await Parent.findOneAndUpdate({ _id: req.params.userId, childhoodInstitution, isVisible: true, isAccepted: false, isAllowed: false }, { $set: { isAccepted: true, isAllowed: true } }, { new: true });
                if (!user) return res.status(404).json({ errorMsg: "Can not find User" });
            }
            res.json(user);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});

// @route   *** PUT /users *** TODO: Done
// @desc    *** Refused parent or animator  *** delete it from the start
// @access  *** Private (only for manager)***
router.put("/refuse_user/:childhoodInstitutionId/:userId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.userId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let user = await TeamMember.findOneAndUpdate({ _id: req.params.userId, childhoodInstitution, status: { $in: ["animator"] }, isVisible: true, isAccepted: false, isAllowed: false }, { $set: { isVisible: false } }, { new: true });
            if (!user) {
                user = await Parent.findOneAndUpdate({ _id: req.params.userId, childhoodInstitution, isVisible: true, isAccepted: false, isAllowed: false }, { $set: { isVisible: false } }, { new: true });
                if (!user) return res.status(404).json({ errorMsg: "Can not find User" });
            }
            res.json(user);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});

// @route   *** PUT /users *** TODO: Done
// @desc    *** remove parent or animator after accepting it before ***
// @access  *** Private (only for manager)***
router.put("/delete_user/:childhoodInstitutionId/:userId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.userId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let user = await TeamMember.findOneAndUpdate({ _id: req.params.userId, childhoodInstitution, status: { $in: ["animator"] }, isAccepted: true, isVisible: true, isAllowed: true }, { $set: { isVisible: false, isAllowed: false } }, { new: true });
            if (!user) {
                user = await Parent.findOneAndUpdate({ _id: req.params.userId, childhoodInstitution, isAccepted: true, isVisible: true, isAllowed: true }, { $set: { isVisible: false, isAllowed: false } }, { new: true });
                if (!user) return res.status(404).json({ errorMsg: "Can not find User" });
            }
            res.json(user);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});



// @route   *** PUT /users *** TODO: Done
// @desc    *** Update parent profile ***
// @access  *** Private (only for manager) ***
router.put("/up_parent_profile_by_manager/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVisible: true, isAccepted: true, isAllowed: true });
            // if a parent is not found 
            if (!parent) return res.status(404).json({ errorMsg: "Can not find User" });
            // else
            const { error, value } = updateParentProfil(req.body);
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
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handling access)" });


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});


// @route   *** GET /users *** TODO: Done
// @desc    *** Get all accepted parents by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/all_accepted_parents/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const parents = await Parent.find({ childhoodInstitution, isAccepted: true, isVisible: true, isAllowed: true }, "-password -__v");
            if (parents.length === 0) return res.status(404).json({ errorMsg: "there are no users available at the moment" });
            res.json(parents);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});


// @route   *** GET /users *** TODO: Done
// @desc    *** Get all Not accepted parents yet by childhoodInstitution  *** (default case at registration)
// @access  *** Private (only for manager)  ***
router.get("/parents_not_accepted_yet/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const parents = await Parent.find({ childhoodInstitution, isVisible: true, isAccepted: false, isAllowed: false }, "-password -__v");
            if (parents.length === 0) return res.status(404).json({ errorMsg: "there are no unaccepted users yet available at the moment" });
            res.json(parents);
        } else return res.status(403).json({ accessError: "Can not access this data (handling access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /users *** TODO: Done
// @desc    *** Get one accepted & visible parent by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/one_accepted_parent/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isAccepted: true, isVisible: true, isAllowed: true }, "-password -__v");
            if (!parent) return res.status(404).json({ errorMsg: " Can not find User" });
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /users *** TODO: Done
// @desc    *** Get one parent not accepted yet by childhoodInstitution *** (default case at registration)
// @access  *** Private for TeamMembers (only for manager) ***
router.get("/one_parent_not_accepted_yet/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        // access only for TeamMembers
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVisible: true, isAccepted: false, isAllowed: false }, "-password -__v");
            if (!parent) return res.status(404).json({ errorMsg: " Can not find User" });
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /users *** TODO: Done
// @desc    *** Get all children of accepted & visible parents by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/all_children/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            let parents = await Parent.find({ childhoodInstitution, isAccepted: true, isVisible: true, isAllowed: true }, "children avatar");
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

// @route   *** GET /users ***      TODO: Done
// @desc    *** Get all children of One visible parent by childhoodInstitution *** (either accepted or not)
// @access  *** Private for all TeamMembers ***
router.get("/all_children/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find this User's children because he's not found." });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVisible: true }, "children");
            if (!parent) return res.status(404).json({ errorMsg: "Can not find this User's children because he's not found" });
            res.json(parent);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

















// @route   *** PUT /users *** TODO: Done
// @desc    *** Update parent profile ***
// @access  *** Private (only  the parent himself) ***
router.put("/up_parent_profile_by_him", authPrivRoutes, async (req, res) => {
    try {
        let parent = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
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


// @route   *** PUT /users ***   TODO: Done
// @desc    *** Update mainPhoneNumber ***
// @access  *** Private (only the parent or the teamMember himself) ***
router.put("/phonenumbers/main", authPrivRoutes, async (req, res) => {
    try {
        let userType;
        let user = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (user) { userType = "TeamMember"; console.log(userType); }
        if (!user) {
            user = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (user) { userType = "Parent"; console.log(userType); }
            if (!user) return res.status(404).json({ errorMsg: "Can not find User with this id." });
        }



        const { error, value } = updateMainPhoneNumber(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { mainPhoneNumber } = req.body;


        const mainPhoneNumberExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": mainPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

        if (mainPhoneNumberExists) return res.status(400).json({ errorMsg: "mainPhoneNumber already exists." });
        //Testes le après avoir ajouter des instanciations du modèle TeamMember

        const PhoneNumberTeamMember = await TeamMember.findOne({ phoneNumber: mainPhoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

        if (PhoneNumberTeamMember) return res.status(400).json({ errorMsg: "mainPhoneNumber already exists" });


        if (userType == "Parent") {
            if (user.phoneNumbers.mainPhoneNumber === mainPhoneNumber) return res.status(400).json({ msg: "Your phone number has not been changed" });
            if (user.phoneNumbers.optionalPhoneNumber === mainPhoneNumber) return res.status(400).json({ msg: `the number entered ${mainPhoneNumber} represents your optional number.` });
            user = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { "phoneNumbers.mainPhoneNumber": mainPhoneNumber } }, { new: true });
            return res.json(user);
        }
        // me.phoneNumbers.mainPhoneNumber = mainPhoneNumber;
        // await me.save()  // method of ahmed
        if (user.phoneNumber === mainPhoneNumber) return res.status(400).json({ msg: "Your phone number has not been changed" });
        user = await TeamMember.findOneAndUpdate({ _id: req.user.id }, { $set: { phoneNumber: mainPhoneNumber } }, { new: true });
        res.json(user);

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
        const parent = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
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
        const newOptionalPhoneNumber = await Parent.findOneAndUpdate({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }, { $set: { "phoneNumbers.optionalPhoneNumber": "" } }, { new: true });
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
        const me = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
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
// @access  *** Private (only the parent or the teamMember himself) ***
router.put("/modify_password", authPrivRoutes, async (req, res) => {
    try {
        let user = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!user) {
            user = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!user) return res.status(404).json({ errorMsg: "Can not find User with this id" });
        }
        const { error, value } = updatePasswordValidation(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { currentPassword, newPassword } = req.body;
        // checking if the password entered and the user password saved in the databse are equal
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ errorMsg: "Invalid current password" });


        if (currentPassword === newPassword) return res.status(400).json({ msg: "You kept the old password!" });

        // before saving our newPassword in the db, we must encrypt it (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        const newPassEncrypted = await bcrypt.hash(newPassword, salt);
        user = await TeamMember.findById(req.user.id);
        if (!user) user = await Parent.findOneAndUpdate({ _id: req.user.id }, { $set: { password: newPassEncrypted } }, { new: true });
        user = await TeamMember.findOneAndUpdate({ _id: req.user.id }, { $set: { password: newPassEncrypted } }, { new: true });
        res.json(user);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});










// @route   *** GET /users *** TODO: Done
// @desc    *** Get one visible parent or teamMember by childhoodInstitution ***
// @access  *** Private for all TeamMembers ***
router.get("/one_parent_or_member/:childhoodInstitutionId/:userId", authPrivRoutes, async (req, res) => {
    if (!checkForHexRegExpFunction(req.params.userId) || !checkForHexRegExpFunction(req.params.childhoodInstitutionId)) return res.status(400).json({ errorMsg: "Can not find User" });
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
        if (!userToAccess) {
            let userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
            if (!userToAccess) return res.status(403).json({ errorMsg: "User Not Found" });
            if (userToAccess._id == req.params.userId && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
                return res.json(userToAccess); // return me
            }
            const childhoodInstitution = req.user.childhoodInstitution;
            userToAccess = await TeamMember.findOne({ _id: req.params.userId, childhoodInstitution, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
            if (!userToAccess) return res.status(404).json({ errorMsg: " Can not find User..." });
            return res.json(userToAccess);
        }
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (userToAccess._id == req.params.userId) return res.json(userToAccess);  // return me 
            const childhoodInstitution = req.user.childhoodInstitution;
            if (userToAccess.status.find(obj => obj.value === "manager")) {
                let user = await TeamMember.findOne({ $and: [{ _id: req.params.userId, childhoodInstitution, isVisible: true }, { $or: [{ isAccepted: true, isAllowed: true }, { isAccepted: false, isAllowed: false }] }] }, "-password -__v");
                if (!user) {
                    user = await Parent.findOne({ $and: [{ _id: req.params.userId, childhoodInstitution, isVisible: true }, { $or: [{ isAccepted: true, isAllowed: true }, { isAccepted: false, isAllowed: false }] }] }, "-password -__v");
                    if (!user) { console.log("not found"); return res.status(404).json({ errorMsg: " Can not find User" }); }
                }
                return res.json(user);
            } else {
                let user = await TeamMember.findOne({ _id: req.params.userId, childhoodInstitution, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
                if (!user) {
                    user = await Parent.findOne({ _id: req.params.userId, childhoodInstitution, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
                    if (!user) return res.status(404).json({ errorMsg: " Can not find User." });
                }
                res.json(user);
            }

        } else return res.status(403).json({ errorMsg: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});




// @route   *** PUT /users *** TODO: Done
// @desc    *** Update parent profile ***
// @access  *** Private (only for manager and parent himself) ***
router.put("/up_parent_profile/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
            if (req.params.parentId !== userToAccess._id.toString()) return res.status(403).json({ accessError: "Can not access this data" });
            const { error, value } = updateParentProfil(req.body);
            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }

            const { father, mother, location, governorate, accountName } = req.body;


            userToAccess.father = father;
            userToAccess.mother = mother;
            userToAccess.location = location;
            userToAccess.governorate = governorate;
            userToAccess.accountName = accountName;

            await userToAccess.save();
            return res.json(userToAccess);
        }
        // access only for TeamMembers (only manager )
        if (userToAccess.status.find(obj => obj.value === "manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution, isVisible: true, isAccepted: true, isAllowed: true });
            // if a parent is not found 
            if (!parent) return res.status(404).json({ errorMsg: "Can not find User." });
            // else
            const { error, value } = updateParentProfil(req.body);
            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }

            const { father, mother, location, governorate, accountName } = req.body;


            parent.father = father;
            parent.mother = mother;
            parent.location = location;
            parent.governorate = governorate;
            parent.accountName = accountName;
            // parent = await Parent.findOneAndUpdate({ _id: req.params.parentId, childhoodInstitution }, { $set: updateParentFields }, { new: true });
            await parent.save();
            res.json(parent);
        } else return res.status(403).json({ accessError: "Can not access this data (handling access)" });


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
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