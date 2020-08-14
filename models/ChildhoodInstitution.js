const mongoose = require("mongoose");

const ChildhoodInstitutionSchema = mongoose.Schema({
    institutionName: {
        type: String,
        required: true
    },
    logo: { // for post avatar
        type: String,
        required: isLogoRequired
    },
    logoForBills: {
        type: String,
        default: ""
    },
    governorate: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    phoneNumbers: {
        type: {
            fixedPhoneNumber: { String, required: true },
            mobilePhoneNumber: {
                type: {
                    mainPhoneNumber: { type: String, required: true },
                    optionalPhoneNumber: { type: String, required: isOptionalPhoneNumberRequired }
                },
                required: true
            }
        },
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",      //    nursery   kindergarten   children_club   nursery_school
        required: true
    },
    foundationEmitter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember"

    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember"

    },
    animators: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeamMember" }]
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, { timestamps: { createdAt: true, updatedAt: false } });

function isLogoRequired() {
    return typeof this.logo === "string" ? false : true;
}

function isOptionalPhoneNumberRequired() {
    return typeof this.phoneNumbers.mobilePhoneNumber.optionalPhoneNumber === "string" ? false : true;
}


module.exports = mongoose.model("ChildhoodInstitution", ChildhoodInstitutionSchema);