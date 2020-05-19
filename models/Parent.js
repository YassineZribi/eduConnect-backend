const mongoose = require('mongoose');

const ParentSchema = mongoose.Schema({
    father: {
        type: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true }
        },
        required: true
    },
    mother: {
        type: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true }
        },
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
    children: {
        type: [
            {
                firstName: { type: String, required: true },
                lastName: { type: String, required: true },
                dateOfBirth: { type: Date, required: true },
                levelOfStudy: { type: String, required: true }
            }
        ],
        required: true
    },
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId, ref: 'ChildhoodInstitution', required: true
    },
    /*
    registrationInstitutions: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChildhoodInstitution', required: true }],
    required: true
    },
    */
    password: {
        type: String,
        required: true
    },

    avatar: {
        type: String,
        default: 'https://www.pngkey.com/png/full/436-4368930_animated-child-png-free-download-on-cartoon-children.png'
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

function isOptionalPhoneNumberRequired() {
    return typeof this.phoneNumbers.optionalPhoneNumber === 'string' ? false : true;
}
module.exports = mongoose.model('Parent', ParentSchema);