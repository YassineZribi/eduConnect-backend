const express = require("express");
const router = express.Router();
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const jwt = require("jsonwebtoken");
const loginValidation = require("../validations/loginValidation");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const Parent = require("../../models/Parent");
const TeamMember = require("../../models/TeamMember");


// @route   *** GET /auth ***
// @desc    *** Test route 1 ***
// @access  *** Public ***
router.get("/test1", (req, res) => {
    res.send("Access Public route Done");
});

// @route   *** GET /auth ***
// @desc    *** Test route 2 ***
// @access  *** Private *** we want to hit this route all the time to make sure or to see if we're logged in or not and also to get the user data 
router.get("/load_user", authPrivRoutes, async (req, res) => {
    // res.send('Access Private route ');
    // res.json(req.user);
    try {
        let user = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
        if (!user) {
            user = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }, "-password -__v");
            if (!user) return res.status(404).json({ error: "user NOT FOUND" });
        }
        res.json(user);
    } catch (err) { // if something goes wrong
        console.error("error:: ", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// @route   *** POST /auth ***
// @desc    *** Authenticate parent or teamMember & get token ***
// @access  *** Public ***
router.post("/:childhoodInstitutionId", async (req, res) => {
    // Validate the data before authenticate the user (using @hapi/joi)
    const { error, value } = loginValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    try {
        // After validation => Checking if the user is already exist or not in the databse by checking his email
        const { phoneNum, password } = req.body;
        let user = await TeamMember.findOne({ phoneNumber: phoneNum, childhoodInstitution: req.params.childhoodInstitutionId });
        if (!user) {
            user = await Parent.findOne({ "phoneNumbers.mainPhoneNumber": phoneNum, childhoodInstitution: req.params.childhoodInstitutionId });
            if (!user) return res.status(400).json({ errorCode: "01", title: "INCOREECTE !", alert: "Le numéro de téléphone ou le mot de passe est incorrect", alertType: "warning" }); // userNotFound: 'User not found' // Phone number or Password is wrong
        }
        user = user.toJSON(); // AHMED ADDED IT TO GET USER OBJECT WITHOUT ANY ERROR

        // checking if the password entered and the user password saved in the databse are equal
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ errorCode: "01", title: "INCOREECTE !", alert: "Le numéro de téléphone ou le mot de passe est incorrect", alertType: "warning" }); // invalidPassword: 'Invalid Password'

        if (user.isVisible && !user.isAccepted && !user.isAllowed) return res.status(401).json({ title: "EN ATTENTE !", alert: "Votre compte n'a pas été encore approuvé. Il est en cours d'examination. Vous recevrez un message de confirmation sur votre numéro de téléphone:" + phoneNum + " pour pouvoir y accéder.", alertType: "info" });
        if (!user.isVisible && !user.isAccepted && !user.isAllowed) return res.status(403).json({ title: "NON APPROUVÉ !", alert: "Pour des raisons de sécurité, votre compte n'a pas été approuvé par l'administration de l'institution. Merci pour votre compréhension.", alertType: "error" });
        if (!user.isVisible && user.isAccepted && !user.isAllowed) return res.status(403).json({ title: "SUPPRIMÉ !", alert: "Votre compte a été supprimé par l'administration de l'institution. Merci pour votre compréhension.", alertType: "error" });


        // Return (sending back) jsonwebtoken to the front-end
        const payload = {
            user: {
                id: user._id,
                childhoodInstitution: user.childhoodInstitution
            }
        };
        jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600000 }, (err, token) => {
            if (err) throw err;
            // user.password = undefined; method of ahmed
            const loggedInUser = { ...user };
            loggedInUser.password = undefined;

            res.json({ token, loggedInUser });
        });


    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::::", err);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: "Server error was occured!!!" });

    }

});

module.exports = router;





