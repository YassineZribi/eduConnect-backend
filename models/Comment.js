const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "onModel"
    },
    onModel: {
        type: String,
        required: true,
        enum: ["Parent", "TeamMember"]
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    text: {
        type: String,
        required: true
    },
    imagesAndVideos: [
        {
            type: String
        }
    ],
    childhoodInstitution: {                     // .populate("childhoodInstitution", ["institutionName", "logo"])
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChildhoodInstitution"
    },
    likes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "onModel"
            },
            userIsParent: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Parent"
            },
            userIsTeamMember: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TeamMember"
            },
            onModel: {
                type: String,
                required: true,
                enum: ["Parent", "TeamMember"]
            }
        }
    ],
    dislikes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "onModel"
            },
            userIsParent: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Parent"
            },
            userIsTeamMember: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TeamMember"
            },
            onModel: {
                type: String,
                required: true,
                enum: ["Parent", "TeamMember"]
            }
        }
    ],
    responses: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "onModel"
            },
            userIsParent: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Parent"
            },
            userIsTeamMember: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TeamMember"
            },
            onModel: {
                type: String,
                required: true,
                enum: ["Parent", "TeamMember"]
            },
            text: {
                type: String,
                required: true
            },
            likes: [
                {
                    user: {
                        type: mongoose.Schema.Types.ObjectId,
                        refPath: "onModel"
                    },
                    userIsParent: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Parent"
                    },
                    userIsTeamMember: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "TeamMember"
                    },
                    onModel: {
                        type: String,
                        required: true,
                        enum: ["Parent", "TeamMember"]
                    }
                }
            ],
            dislikes: [
                {
                    user: {
                        type: mongoose.Schema.Types.ObjectId,
                        refPath: "onModel"
                    },
                    userIsParent: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Parent"
                    },
                    userIsTeamMember: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "TeamMember"
                    },
                    onModel: {
                        type: String,
                        required: true,
                        enum: ["Parent", "TeamMember"]
                    }
                }
            ],
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model("Comment", CommentSchema);



