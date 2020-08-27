const mongoose = require("mongoose");

const TeamMemberSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    nationalIdCard: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true   // checkbox          foundationEmitter    manager    animator
    },
    gender: {
        type: String,
        required: true
    },
    status: {
        type: [
            {
                value: {
                    type: String,
                    required: true
                },
                label: {
                    type: String,
                    required: true
                },
            }
        ],
        required: true
    },
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChildhoodInstitution",
        required: true
    },
    location: {
        type: String,
        required: true
    },
    governorate: {
        type: String,
        required: true
    },
    teachingLevel: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    isAccepted: {
        type: Boolean,
        default: false
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    isAllowed: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/dwnijopcn/image/upload/v1597616092/default_avatar_for_teammember_dvcgpo.png",

    },
    createdOn: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model("TeamMember", TeamMemberSchema);