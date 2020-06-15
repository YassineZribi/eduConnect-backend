const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Parent = require("../../models/Parent");
const TeamMember = require("../../models/TeamMember");
const registerTeamMemberValidation = require("../validations/registerTeamMemberValidation");
const { updateTeamMemberProfileValidation, updatephoneNumberValidation, updatePasswordValidation, updateStatusValidation, updateTeachingLevelValidation } = require("../validations/updateTeamMemberValidation");
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const checkForHexRegExpFunction = require("../validations/checkMongodbIdValidity");
require("dotenv").config();

// @route   *** GET /team_members ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/", (req, res) => {
    res.send("team_members route");
});


// @route   *** POST /team_members ***
// @desc    *** Register teamMember ***
// @access  *** Public ***
router.post("/create_member/:childhoodInstitutionId", async (req, res) => {
    // Validate the data before registering the user (using @hapi/joi)
    const { error, value } = registerTeamMemberValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.label]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    try {
        // After validation => Checking if the user is already exist or not in the databse by checking his email
        const { phoneNumber } = req.body;

        const teamMemberExists = await TeamMember.findOne({ phoneNumber: phoneNumber, childhoodInstitution: req.params.childhoodInstitutionId });
        if (teamMemberExists) return res.status(400).json({ errorCode: "01", title: "IMPORTANT !", alert: "User already exists", alertType: "error" });

        const parentExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": phoneNumber, childhoodInstitution: req.params.childhoodInstitutionId });
        if (parentExists) return res.status(400).json({ errorCode: "01", title: "IMPORTANT !", alert: "User already exists", alertType: "error" });


        const { firstName, lastName, nationalIdCard, gender, status, location, governorate, teachingLevel, password } = req.body;

        const newTeamMember = {
            firstName,
            lastName,
            nationalIdCard,
            phoneNumber,
            gender,
            status: status.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0)),
            childhoodInstitution: req.params.childhoodInstitutionId,
            location,
            governorate,
            password // now this password is not encrypted yet
        };
        if (teachingLevel) newTeamMember.teachingLevel = teachingLevel;
        // if (status.includes('animator')) newTeamMember.teachingLevel = teachingLevel;




        // Create an instance of a User
        const teamMember = new TeamMember(newTeamMember);



        // before saving our instance in the db, we must encrypt password (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        teamMember.password = await bcrypt.hash(password, salt);
        // All right , now we can Interact with the database and register the user 
        await teamMember.save();

        // if (teamMember.isVisible && !teamMember.isAccepted && !teamMember.isAllowed) : (default case at registration)
        return res.json({ title: "Votre compte a été créé avec Succés", alert: "Pour des raisons de sécurité et pour protéger nos Enfants , tous les comptes nouvellement créés doivent être examiner avant d'avoir l'accès.  Vous receverez un message de confirmation sur votre numéro de téléphone:" + teamMember.phoneNumber + "pour pouvoir y accéder. Merci pour votre compréhension.", alertType: "success" });




        // Return (sending back) jsonwebtoken once the user registered (the reason I'm reterning jwt is because in the front end when a user registers I want him to get logged in right away . and in order to logged in right away you must have that token)
        /*
        const payload = {
            user: {
                id: teamMember.id,
                childhoodInstitution: teamMember.childhoodInstitution
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
/*
// @route   *** PUT /team_members ***
// @desc    *** Accepted animator  ***
// @access  *** Private (only for manager)***
router.put("/accept_animator/:childhoodInstitutionId/:teamMemberId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.teamMemberId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const animator = await TeamMember.findOneAndUpdate({ _id: req.params.teamMemberId, childhoodInstitution, status: { $in: ["animator"] } , isVisible: true, isAccepted: false, isAllowed: false }, { $set: { isAccepted: true, isAllowed: true } }, { new: true });
            if (!animator) return res.status(404).json({ errorMsg: "Can not find User" });
            res.json(animator);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});
*/

/*
// @route   *** PUT /users ***
// @desc    *** Refused animator *** delete it from the start
// @access  *** Private (only for manager)***
router.put("/refuse_animator/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {

    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOneAndUpdate({ _id: req.params.parentId, childhoodInstitution, isVisible: true, isAccepted: false, isAllowed: false }, { $set: { isVisible: false } }, { new: true });
            if (!parent) return res.status(404).json({ errorMsg: "Can not find User" });
            res.json(parent);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});

*/


// @route   *** PUT /team_members ***
// @desc    *** Update status of animator ***
// @access  *** Private (only for manager)***
router.put("/update_status/:childhoodInstitutionId/:userId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.userId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let animator = await TeamMember.findOne({ _id: req.params.userId, childhoodInstitution, status: { $in: ["animator"] }, isVisible: true, isAccepted: true, isAllowed: true });
            // if a parent is not found 
            if (!animator) return res.status(404).json({ errorMsg: "Can not find User" });
            // else
            const { error, value } = updateStatusValidation(req.body);

            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }

            const { status } = req.body;

            // we're ready to update it in the db

            let toStringTeamstatus = [...animator.status.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0))]; // cette .sort() wa9t tkamel l'appli na7iha zeyda 
            let toStringStatus = [...status.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0))];
            if (toStringTeamstatus.toString() === toStringStatus.toString()) return res.status(400).json({ errorMsg: "no changes have been made" }); // aucune modification n'a été éffectuée

            //  res.json({ toStringTeamstatus: toStringTeamstatus.toString(), toStringStatus: toStringStatus.toString(), teamMember: teamMember.status, status });
            animator = await TeamMember.findOneAndUpdate({ _id: req.params.userId }, { $set: { status } }, { new: true });
            res.json(animator);

        } else return res.status(403).json({ accessError: "Can not access this data (handling access)" });


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});


// @route   *** PUT /team_members ***
// @desc    *** Update teachingLevel ***
// @access  *** Private (only for manager)***
router.put("/update_teachinglevel/:childhoodInstitutionId/:userId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.userId)) return res.status(400).json({ errorMsg: "Can not find User" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let animator = await TeamMember.findOne({ _id: req.params.userId, childhoodInstitution, status: { $in: ["animator"] }, isVisible: true, isAccepted: true, isAllowed: true });
            // if a parent is not found 
            if (!animator) return res.status(404).json({ errorMsg: "Can not find User" });
            // else
            const { error, value } = updateTeachingLevelValidation(req.body);

            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }

            const { teachingLevel } = req.body;
            // we're ready to update it in the db

            if (teachingLevel) animator = await TeamMember.findOneAndUpdate({ _id: req.params.userId }, { $set: { teachingLevel } }, { new: true });
            else animator = await TeamMember.findOneAndUpdate({ _id: req.params.userId }, { $unset: { teachingLevel: "" } }, { new: true });
            return res.json(animator);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});

















// @route   *** PUT /team_members ***
// @desc    *** Update team member profile ***
// @access  *** Private (only the teamMember himself) ***
router.put("/", authPrivRoutes, async (req, res) => {
    try {
        let teamMember = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!teamMember) return res.status(404).json({ errorMsg: "Can not update profil because we can not find User with this id" });
        const { error, value } = updateTeamMemberProfileValidation(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { firstName, lastName, nationalIdCard, governorate } = req.body;

        // Build profileobject
        const updateTeamMemberFields = {
            firstName,
            lastName,
            nationalIdCard,
            governorate
        };

        // we're ready to update it in the db

        teamMember = await TeamMember.findOneAndUpdate({ _id: req.user.id }, { $set: updateTeamMemberFields }, { new: true });
        return res.json(teamMember);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }
});

/*
// @route   *** PUT /users ***
// @desc    *** Update phoneNumber ***
// @access  *** Private (only the teamMember himself) ***
router.put("/update_phonenumber", authPrivRoutes, async (req, res) => {
    try {
        let teamMember = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!teamMember) return res.status(404).json({ errorMsg: "Can not find User with this id" });
        const { error, value } = updatephoneNumberValidation(req.body);

        if (error) {
            // console.log("error ", error);
            // console.log('error:: ', JSON.stringify(error, null, 2));
            console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
            return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
        }

        const { phoneNumber } = req.body;


        const phoneNumberExists = await TeamMember.findOne({ phoneNumber: phoneNumber, _id: { $ne: req.user.id }, childhoodInstitution: req.user.childhoodInstitution });

        if (phoneNumberExists) return res.status(400).json({ errorMsg: "phoneNumber already exists" });
        //Testes le après avoir ajouter des instanciations du modèle TeamMember

        const PhoneNumberTeamMemberExists = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": phoneNumber, childhoodInstitution: req.user.childhoodInstitution });

        if (PhoneNumberTeamMemberExists) return res.status(400).json({ errorMsg: "phoneNumber already exists" });


        
        if (teamMember.phoneNumber === phoneNumber) return res.status(400).json({ msg: "Your phone number has not been changed" });
        // me.phoneNumbers.mainPhoneNumber = mainPhoneNumber;
        // await me.save()  // method of ahmed
        teamMember = await TeamMember.findOneAndUpdate({ _id: req.user.id }, { $set: { phoneNumber: phoneNumber } }, { new: true });
        res.json(teamMember);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});
*/


/*
// @route   *** PUT /users ***
// @desc    *** modify password ***
// @access  *** Private ***
router.put("/modify_password", authPrivRoutes, async (req, res) => {
    const { error, value } = updatePasswordValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }

    try {
        const teamMember = await TeamMember.findOne({ _id: req.user.id });
        if (!teamMember) return res.status(400).json({ errorMsg: "Can not found the user" });

        const { currentPassword, newPassword } = req.body;
        // checking if the password entered and the user password saved in the databse are equal
        const isMatch = await bcrypt.compare(currentPassword, teamMember.password);
        if (!isMatch) return res.status(401).json({ errorMsg: "Invalid current password" });


        if (currentPassword === newPassword) return res.status(400).json({ msg: "You kept the old password !" });

        // before saving our newPassword in the db, we must encrypt it (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        const newPassEncrypted = await bcrypt.hash(newPassword, salt);

        const userAfterChangingPassword = await TeamMember.findOneAndUpdate({ _id: req.user.id }, { $set: { password: newPassEncrypted } }, { new: true });
        res.json(userAfterChangingPassword);

    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: "Server error has occcured !" });
    }

});
*/

module.exports = router;