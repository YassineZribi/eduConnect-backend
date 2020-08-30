const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Chat = require("../../models/Chat");
const TeamMember = require("../../models/TeamMember");
const Parent = require("../../models/Parent");
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const checkForHexRegExpFunction = require("../validations/checkMongodbIdValidity");
require("dotenv").config();


// @route   *** GET /chats ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("you are in Chats route YZ");
});

// @route   *** GET /chats ***
// @desc    *** Get all messages by childhoodInstitution ***
// @access  *** Private (only for the Manager) ***
router.get("/users/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.status.find(obj => obj.value === "manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const messages = await Chat.find({ childhoodInstitution }, "-__v");
            //if (messages.length === 0) return res.status(404).json({ errorMsg: "there are no users available at the moment" });
            res.json(messages);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /chats ***
// @desc    *** Get specific parent messages ***
// @access  *** Private (only for the Manager) ***
router.get("/user/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers
        if (userToAccess.childhoodInstitution == req.params.childhoodInstitutionId && userToAccess._id == req.params.parentId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = req.user.id;
            const messages = await Chat.find({ parent, childhoodInstitution }, "-__v");
            //if (messages.length === 0) return res.status(404).json({ errorMsg: "there are no users available at the moment" });
            res.json(messages);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});



module.exports = router;