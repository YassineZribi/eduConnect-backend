const express = require("express");
const router = express.Router();
const authPrivRoutes = require("../middleware/authPrivRoutes");
const Post = require("../models/Post");
const TeamMember = require("../models/TeamMember");
const Parent = require("../models/Parent");
const Comment = require("../models/Comment");
const createPostValidation = require("./validations/createPostValidation");
const createCommentValidation = require("./validations/createCommentValidation");
const createCommentResponseValidation = require("./validations/createCommentResponseValidation");

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

            const newPost = {
                teamMember: req.user.id,
                text: req.body.text,
                imagesAndVideos: req.body.imagesAndVideos,
                childhoodInstitution: req.user.childhoodInstitution
            };


            const post = new Post(newPost);
            await post.save();
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
            const posts = await Post.find({ childhoodInstitution: req.user.childhoodInstitution }).sort({ date: -1 });
            if (posts.length === 0) return res.status(404).json({ errorMsg: "there is no posts to show" });
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
            const post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.childhoodInstitution });
            if (!post) return res.status(404).json({ errorMsg: "Post not found" });
            res.json(post);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** Delete /posts ***
// @desc    *** (delete) one post by ID ***
// @access  *** Private ***
router.delete("/:childhoodInstitutionId/:post_id", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            // check if the mongodb id is true 
            if (!checkForHexRegExpFunction(req.params.post_id)) return res.status(400).json({ errorMsg: "Can not find Post.." });
            let post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.childhoodInstitution });
            if (!post) return res.status(404).json({ errorMsg: "post not found" });
            await Comment.deleteMany({ post: post._id });
            // check user: (this below line means that only the user who created this posts can delete it )
            // if (post.user.toString() !== req.user.id) return res.status(403).json({ errorMsg: "User not authorized" });

            await post.remove();
            res.json({ msg: "Post removed !" });
        } else return res.status(403).json({ accessError: "Can not access this data (User not authorized)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});


// @route   *** PUT /posts ***
// @desc    *** Like a post ***
// @access  *** Private ***
router.put("/add_like2/:post_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        const post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.childhoodInstitution });
        if (!post) return res.status(404).json({ errorMsg: "post not found" });

        // check if the post has already been disliked by the connected user
        if (post.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
            post.dislikes = post.dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
            /*
            await post.save();
            return res.json(post.dislikes);
            */
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        // check if the post has already been liked by the connected user
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            post.likes = post.likes.filter(like => like.user.toString() !== req.user.id);
            await post.save();
            return res.json({ likes: post.likes, dislikes: post.dislikes });
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        post.likes.unshift({ user: req.user.id, onModel: userIs });
        await post.save();
        //res.json(post.likes);
        res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });

    }
});

// @route   *** PUT /posts ***
// @desc    *** Dislike a post ***
// @access  *** Private ***
router.put("/add_dislike2/:post_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        const post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.childhoodInstitution });
        if (!post) return res.status(404).json({ errorMsg: "post not found" });

        // check if the post has already been liked by the connected user
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            post.likes = post.likes.filter(like => like.user.toString() !== req.user.id);
            /*
            await post.save();
            return res.json(post.likes);
            */
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        // check if the post has already been liked by the connected user
        if (post.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
            post.dislikes = post.dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
            await post.save();
            return res.json({ likes: post.likes, dislikes: post.dislikes });
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        post.dislikes.unshift({ user: req.user.id, onModel: userIs });
        await post.save();
        // res.json(post.dislikes);
        res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});



// @route   *** POST /posts ***
// @desc    *** Create a comment ***
// @access  *** Private ***
router.post("/:childhoodInstitutionId/comment/:post_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }



        if (userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            const post = await Post.findById(req.params.post_id);
            if (!post) return res.status(404).json({ errorMsg: "Can not find the Post" });
            const { error, value } = createCommentValidation(req.body);

            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }


            const newComment = {
                user: req.user.id,
                onModel: userIs,
                post: post._id,
                text: req.body.text,
                childhoodInstitution: req.user.childhoodInstitution
            };


            const comment = new Comment(newComment);
            await comment.save();
            res.json(comment);

        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});


// @route   *** Delete /posts ***
// @desc    *** (delete) one comment by ID ***
// @access  *** Private ***
router.delete("/:childhoodInstitutionId/:comment_id", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });

        }
        // check if the mongodb id is true  TODO
        let comment = await Comment.findById(req.params.comment_id);
        if (!comment) return res.status(404).json({ errorMsg: "comment not found (comment does not exist)" });

        // access only for TeamMembers (only manager ) or the person who make the comment
        if ((userToAccess.status.includes("manager") || comment.user.toString() === req.user.id) && userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {


            await comment.remove();
            res.json({ msg: "Post removed !" });
        } else return res.status(403).json({ accessError: "User not authorized" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** PUT (delete) /posts ***
// @desc    *** put (delete) one response  ***
// @access  *** Private ***
router.delete("/:childhoodInstitutionId/:comment_id/:response_id", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });

        }
        // check if the mongodb id is true  TODO
        let comment = await Comment.findById(req.params.comment_id);
        if (!comment) return res.status(404).json({ errorMsg: "post not found" });

        // access only for TeamMembers (only manager ) or the person who make the comment
        if ((userToAccess.status.includes("manager") || comment.user.toString() === req.user.id) && userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {

            const findIndex = comment.responses.map(response => response._id.toString()).indexOf(req.params.response_id);
            comment.responses.splice(findIndex, 1);

            await comment.save();
            res.json({ msg: "Comment removed !" });
        } else return res.status(403).json({ accessError: "User not authorized" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});


// @route   *** PUT /posts ***
// @desc    *** Like a comment ***
// @access  *** Private ***
router.put("/add_like_to_comment/:post_id/:comment_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        const comment = await Comment.findOne({ _id: req.params.comment_id, childhoodInstitution: req.user.childhoodInstitution, post: req.params.post_id });
        if (!comment) return res.status(404).json({ errorMsg: "post not found" });

        // check if the post has already been disliked by the connected user
        if (comment.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
            comment.dislikes = comment.dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
            /*
            await post.save();
            return res.json(post.dislikes);
            */
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        // check if the post has already been liked by the connected user
        if (comment.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            comment.likes = comment.likes.filter(like => like.user.toString() !== req.user.id);
            await comment.save();
            return res.json({ likes: comment.likes, dislikes: comment.dislikes });
            // return res.status(400).json({ errorMsg: "comment.responses already liked by you" });
        }

        comment.likes.unshift({ user: req.user.id, onModel: userIs });
        await comment.save();
        //res.json(comment.likes);
        res.json({ likes: comment.likes, dislikes: comment.dislikes });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });

    }
});

// @route   *** PUT /posts ***
// @desc    *** Dislike a comment ***
// @access  *** Private ***
router.put("/add_dislike_to_comment/:post_id/:comment_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        const comment = await Comment.findOne({ _id: req.params.comment_id, childhoodInstitution: req.user.childhoodInstitution, post: req.params.post_id });
        if (!comment) return res.status(404).json({ errorMsg: "post not found" });


        // check if the post has already been liked by the connected user
        if (comment.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            comment.likes = comment.likes.filter(like => like.user.toString() !== req.user.id);
            /*
            await post.save();
            return res.json(post.likes);
            */
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        // check if the post has already been liked by the connected user
        if (comment.dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
            comment.dislikes = comment.dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
            await comment.save();
            return res.json({ likes: comment.likes, dislikes: comment.dislikes });
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        comment.dislikes.unshift({ user: req.user.id, onModel: userIs });
        await comment.save();
        // res.json(comment.dislikes);
        res.json({ likes: comment.likes, dislikes: comment.dislikes });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});


// @route   *** POST /posts ***
// @desc    *** Create a comment response ***
// @access  *** Private ***
router.post("/:childhoodInstitutionId/comment_response/:comment_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        if (userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {

            const { error, value } = createCommentResponseValidation(req.body);

            if (error) {
                // console.log("error ", error);
                // console.log('error:: ', JSON.stringify(error, null, 2));
                console.log(JSON.stringify(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}), null, 2));
                return res.status(400).json(error.details.map(obj => ({ [obj.context.key]: obj.message })).reduce((acc, cV) => ({ ...acc, ...cV }), {}));
            }


            const comment = await Comment.findById(req.params.comment_id);
            if (!comment) return res.status(404).json({ errorMsg: "Can not find the Post" });


            const newResponse = {
                user: req.user.id,
                onModel: userIs,
                text: req.body.text,
                // childhoodInstitution: req.user.childhoodInstitution
            };

            comment.responses.push(newResponse);
            await comment.save();
            res.json(comment);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** GET /posts ***
// @desc    *** Get all post comments  by ID ***
// @access  *** Private ***
router.get("/all_comments_by_post/:childhoodInstitutionId/:post_id", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });

        }
        if (userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.post_id)) return res.status(400).json({ errorMsg: "Can not find Post" });
            const comments = await Comment.find({ post: req.params.post_id, childhoodInstitution: req.user.childhoodInstitution });
            if (comments.length === 0) return res.status(404).json({ errorMsg: "there is no comments to show" });
            res.json(comments);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});


// @route   *** PUT /posts ***
// @desc    *** Like a response ***
// @access  *** Private ***
router.put("/add_like_to_response/:comment_id/:response_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        const comment = await Comment.findOne({ _id: req.params.comment_id, childhoodInstitution: req.user.childhoodInstitution });
        if (!comment) return res.status(404).json({ errorMsg: "post not found" });

        const findIndex = comment.responses.map(response => response._id.toString()).indexOf(req.params.response_id);

        // check if the post has already been disliked by the connected user
        if (comment.responses[findIndex].dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
            comment.responses[findIndex].dislikes = comment.responses[findIndex].dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
            /*
            await post.save();
            return res.json(post.dislikes);
            */
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        // check if the post has already been liked by the connected user
        if (comment.responses[findIndex].likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            comment.responses[findIndex].likes = comment.responses[findIndex].likes.filter(like => like.user.toString() !== req.user.id);
            await comment.save();
            return res.json({ likes: comment.responses[findIndex].likes, dislikes: comment.responses[findIndex].dislikes });
            // return res.status(400).json({ errorMsg: "comment.responses already liked by you" });
        }

        comment.responses[findIndex].likes.unshift({ user: req.user.id, onModel: userIs });
        await comment.save();
        //res.json(comment.responses[findIndex].likes);
        res.json({ likes: comment.responses[findIndex].likes, dislikes: comment.responses[findIndex].dislikes });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });

    }
});

// @route   *** PUT /posts ***
// @desc    *** Dislike a response ***
// @access  *** Private ***
router.put("/add_dislike_to_response/:comment_id/:response_id", authPrivRoutes, async (req, res) => {
    try {
        let userIs;
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (userToAccess) userIs = "TeamMember";
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (userToAccess) userIs = "Parent";
            if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        }
        const comment = await Comment.findOne({ _id: req.params.comment_id, childhoodInstitution: req.user.childhoodInstitution });
        if (!comment) return res.status(404).json({ errorMsg: "post not found" });

        const findIndex = comment.responses.map(response => response._id.toString()).indexOf(req.params.response_id);


        // check if the post has already been liked by the connected user
        if (comment.responses[findIndex].likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            comment.responses[findIndex].likes = comment.responses[findIndex].likes.filter(like => like.user.toString() !== req.user.id);
            /*
            await post.save();
            return res.json(post.likes);
            */
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        // check if the post has already been liked by the connected user
        if (comment.responses[findIndex].dislikes.filter(dislike => dislike.user.toString() === req.user.id).length > 0) {
            comment.responses[findIndex].dislikes = comment.responses[findIndex].dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
            await comment.save();
            return res.json({ likes: comment.responses[findIndex].likes, dislikes: comment.responses[findIndex].dislikes });
            // return res.status(400).json({ errorMsg: "post already liked by you" });
        }

        comment.responses[findIndex].dislikes.unshift({ user: req.user.id, onModel: userIs });
        await comment.save();
        // res.json(comment.responses[findIndex].dislikes);
        res.json({ likes: comment.responses[findIndex].likes, dislikes: comment.responses[findIndex].dislikes });
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

module.exports = router;



// @route   *** PUT /posts ***
// @desc    *** update(delete) one post by ID ***
// @access  *** Private ***
/*
router.put("/:childhoodInstitutionId/:post_id", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });


        // access only for TeamMembers (only manager )
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.post_id)) return res.status(400).json({ errorMsg: "Can not find Post" });
            let post = await Post.findOne({ _id: req.params.post_id, childhoodInstitution: req.user.childhoodInstitution, isVisible: true });
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
*/