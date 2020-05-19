const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent');
const registerUserValidation = require('./validations/registerUserValidation');
require('dotenv').config();


// @route   *** GET /users ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get('/', (req, res) => {
    res.send('User route');
});


// @route   *** POST /users ***
// @desc    *** Register user ***
// @access  *** Public ***
router.post('/', async (req, res) => {
    // Validate the data before registering the user (using @hapi/joi)
    const { error, value } = registerUserValidation(req.body);

    if (error) {
        // console.log("error ", error);
        // console.log('error:: ', JSON.stringify(error, null, 2));
        console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
        return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
    }
    try {
        // After validation => Checking if the user is already exist or not in the databse by checking his email
        const { name, email, password } = req.body;
        const emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ existsEmail: 'Email already exists' });

        // Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        // Create an instance of a User
        const user = new User({
            name,
            email,
            password, // now this password is not encrypted yet
            avatar

        });

        // before saving our instance in the db, we must encrypt password (using bcrypt) -> (we shouldn't store password in database in plain text)
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        // All right , now we can Interact with the database and register the user 
        await user.save();


        // Return (sending back) jsonwebtoken once the user registered (the reason I'm reterning jwt is because in the front end when a user registers I want him to get logged in right away . and in order to logged in right away you must have that token)
        const payload = {
            user: {
                id: user.id
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

module.exports = router;