const mongoose = require("mongoose");

const ParentSchema = mongoose.Schema({
    father: {
        type: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            nationalIdCard: { type: String, required: true }
        },
        required: true
    },
    mother: {
        type: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            nationalIdCard: { type: String, required: true }
        },
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    phoneNumbers: {
        type: {
            mainPhoneNumber: { type: String, required: true }, // unique: true
            optionalPhoneNumber: { type: String, required: isOptionalPhoneNumberRequired }
        },
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
    // status: {
    //     type: [{ type: String }],
    //     default: ["parent"]
    // },
    status: {
        type: [
            {
                value: String,
                label: String
            }

        ],
        default: [{ value: "parent", label: "Parent" }]
    },
    children: {
        type: [
            {
                firstName: { type: String, required: true },
                lastName: { type: String, required: true },
                avatar: { type: String, default: "https://www.pngkey.com/png/full/436-4368930_animated-child-png-free-download-on-cartoon-children.png" },
                dateOfBirth: { type: Date, required: true },
                levelOfStudy: { type: String, required: true },
                gender: { type: String, required: true } // girl boy
            }
        ],
        required: true
    },
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId, ref: "ChildhoodInstitution", required: true
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
        default: "https://res.cloudinary.com/dwnijopcn/image/upload/v1597616851/default_avatar_for_parent_fh2ran.jpg"
    }
}, { timestamps: { createdAt: true, updatedAt: false } });

function isOptionalPhoneNumberRequired() {
    return typeof this.phoneNumbers.optionalPhoneNumber === "string" ? false : true;
}
module.exports = mongoose.model("Parent", ParentSchema);


/*
registrationInstitutions: {
type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChildhoodInstitution', required: true }],
required: true
},
*/