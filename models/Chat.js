const mongoose = require("mongoose");

const ChatSchema = mongoose.Schema({
    content: {
        type: String,
    },
    sender: {
        type: String,
    },
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChildhoodInstitution"
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent"
    },
    type: {
        type: String,
        default: "text"
    },
    time: {
        type: Date,
        default: Date.now
    }
});



module.exports = mongoose.model("Chat", ChatSchema);



/*

    senderIsParent: {
        type: Schema.Types.ObjectId,
        ref: "Parent"
    },
    senderIsTeamMember: {
        type: Schema.Types.ObjectId,
        ref: "TeamMember"
    },
    receiverIsParent: {
        type: Schema.Types.ObjectId,
        ref: "Parent"
    },
    receiverIsTeamMember: {
        type: Schema.Types.ObjectId,
        ref: "TeamMember"
    },




*/