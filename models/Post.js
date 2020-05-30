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
            onModel: {
                type: String,
                required: true,
                enum: ["Parent", "TeamMember"]
            }
        }
    ],
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "onModel"
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
            name: {
                type: String
            },
            avatar: {
                type: String
            },
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


module.exports = mongoose.model("Post", PostSchema);



