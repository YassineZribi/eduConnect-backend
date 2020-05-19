const express = require('express');
const router = express.Router();
const authPrivRoutes = require('../middleware/authPrivRoutes');
const Parent = require('../models/Parent');



// @route   *** GET /profile ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get('/', (req, res) => {
    res.send('Profile route');
});

// @route   *** GET /profile/me *** this particular endpoint used to get one user profile based on ther user ID tha's in the token 
// @desc    *** Get one user Profile ***
// @access  *** Private *** private because we are getting the user profile by user ID that's in the token
router.get('/me', authPrivRoutes, async (req, res) => {
    // we are gonna be using async/await beacause we're using Mongoose which returns a promise 
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('User', ['name', 'avatar']);
        // rule : findOne return null if it matchs anything
        if (!profile) return res.status(404).json({ errorMsg: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }
});

module.exports = router;