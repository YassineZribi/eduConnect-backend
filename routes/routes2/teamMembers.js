const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Parent = require('../../models/Parent');
const TeamMember = require('../../models/TeamMember');
const registerParentValidation = require('../validations/registerParentValidation');
const registerTeamMemberValidation = require('../validations/registerTeamMemberValidation');
const updateParentValidation = require('../validations/updateParentValidation');
const updatePasswordValidation = require('../validations/updatePasswordValidation');
const { updateTeamMemberProfileValidation } = require('../validations/updateTeamMemberValidation');
const authPrivRoutes = require('../../middleware/authPrivRoutes');
require('dotenv').config();

// @route   *** GET /team_members ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get('/', (req, res) => {
    res.send('team_members route');
});


// @route   *** POST /team_members ***
// @desc    *** Register teamMember ***
// @access  *** Public ***
router.post('/', async (req, res) => {
    // Validate the data before registering the user (using @hapi/joi)
    const { error, value } = registerTeamMemberValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    try {
        // After validation => Checking if the user is already exist or not in the databse by checking his email
        const { phoneNumber, childhoodInstitution } = req.body;
        const parentExists = await Parent.findOne({ 'phoneNumbers.mainPhoneNumber': phoneNumber, childhoodInstitution: childhoodInstitution });
        if (parentExists) return res.status(400).json({ errorMsg: 'User already exists' });

        const teamMemberExists = await TeamMember.findOne({ phoneNumber: phoneNumber, childhoodInstitution: childhoodInstitution });
        if (teamMemberExists) return res.status(400).json({ errorMsg: 'User already exists' });

        const { firstName, lastName, nationalIdCard, status, governorate, teachingLevel, password } = req.body;

        const newTeamMember = {
            firstName,
            lastName,
            nationalIdCard,
            phoneNumber,
            status,
            childhoodInstitution,
            governorate,
            password // now this password is not encrypted yet
        };
        if (teachingLevel) newTeamMember.teachingLevel = teachingLevel;



        // Create an instance of a User
        const teamMember = new TeamMember(newTeamMember);



        // before saving our instance in the db, we must encrypt password (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        teamMember.password = await bcrypt.hash(password, salt);
        // All right , now we can Interact with the database and register the user 
        await teamMember.save();


        // Return (sending back) jsonwebtoken once the user registered (the reason I'm reterning jwt is because in the front end when a user registers I want him to get logged in right away . and in order to logged in right away you must have that token)
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


    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log('error::', err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: 'Server error was occured!!!' });

    }


});

// @route   *** PUT /team_members ***
// @desc    *** Update team member profile ***
// @access  *** Private ***
router.put('/', authPrivRoutes, async (req, res) => {
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

    try {
        const teamMember = await TeamMember.findOneAndUpdate({ _id: req.user.id }, { $set: updateTeamMemberFields }, { new: true });
        // if teamMember is not found 
        if (!teamMember) return res.status(404).json({ errorMsg: "Can not found User" });
        // else
        return res.json(teamMember);


    } catch (err) {
        console.error("error::", err.message);
        res.status(500).json({ errorMsg: 'Server error has occcured !' });
    }
});



module.exports = router;