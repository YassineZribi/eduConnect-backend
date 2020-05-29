const express = require("express");
const router = express.Router();
const authPrivRoutes = require("../middleware/authPrivRoutes");
const Post = require("../models/Post");
const TeamMember = require("../models/TeamMember");
const Parent = require("../models/Parent");
const createPostValidation = require("./validations/createPostValidation");
const checkForHexRegExpFunction = require("./validations/checkMongodbIdValidity");





// @route   *** GET /posts ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("Posts route");
});

// @route   *** POST /posts ***
// @desc    *** Create a post ***
// @access  *** Private  (only for manager)***
router.post("/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });


        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
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

// @route   *** GET /posts ***
// @desc    *** Get all posts ***
// @access  *** Private ***
router.get("/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });

        }

        // access only for TeamMembers (only manager )
        if (userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            const posts = await Post.find({ childhoodInstitution: req.user.id, isVisible: true }).sort({ date: -1 });
            if (!posts) return res.status(404).json({ errorMsg: "Can not find User" });
            res.json(posts);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** GET /posts ***
// @desc    *** Get one post by ID ***
// @access  *** Private ***
router.get("/:childhoodInstitutionId/:post_id", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });

        }
        if (userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.post_id)) return res.status(400).json({ errorMsg: "Can not find Post" });
            const post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.id, isVisible: true });
            if (!post) return res.status(404).json({ errorMsg: "Post not found" });
            res.json(post);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** PUT /posts ***
// @desc    *** update(delete) one post by ID ***
// @access  *** Private ***
router.put("/:childhoodInstitutionId/:post_id", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });


        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.post_id)) return res.status(400).json({ errorMsg: "Can not find Post" });
            let post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.id, isVisible: true });
            if (!post) return res.status(404).json({ errorMsg: "post not found" });
            // check user (this below line means that only the user who created this posts can delete it )
            // if (post.teamMember.toString() !== req.user.id) return res.status(403).json({ errorMsg: "User not authorized" });

            post.isVisible = false;
            post.save();
            res.json(post);
        } else return res.status(403).json({ accessError: "Can not access this data (User not authorized)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

module.exports = router;