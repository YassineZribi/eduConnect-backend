const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    teamMember: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember"
    },
    text: {
        type: String,
        required: true
    },
    imagesAndVideos: [
        {
            url: String,
            category: String

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
    date: {
        type: Date,
        default: Date.now
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        }
    ]
});


module.exports = mongoose.model("Post", PostSchema);



