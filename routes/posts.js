const express = require("express");
const router = express.Router();
const authPrivRoutes = require("../middleware/authPrivRoutes");
const Post = require("../models/Post");
// const Profile = require("../models/Profile");
// const User = require("../models/User");
const TeamMember = require("../models/TeamMember");
const createPostValidation = require("./validations/createPostValidation");
const checkForHexRegExpFunction = require("./validations/checkMongodbIdValidity");





// @route   *** GET /posts ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/", (req, res) => {
    res.send("Posts route");
});

// @route   *** POST /posts ***
// @desc    *** Create a post ***
// @access  *** Private ***
router.post("/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });


        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution._id == req.params.childhoodInstitutionId) {
            const { error, value } = createPostValidation(req.body);

            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }


            // const teamMember = await TeamMember.findById(req.user.id, "-password");
            // if (!teamMember) return res.status(404).json({ errorMsg: "Can not find User" });

            const newPost = {
                teamMember: req.user.id,
                text: req.body.text,
                imagesAndVideos: req.body.imagesAndVideos,
                childhoodInstitution: req.user.childhoodInstitution
            };


            const post = new Post(newPost);
            post.save();
            res.json(post);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});
module.exports = router;