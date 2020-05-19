const mongoose = require('mongoose');

const ChildhoodInstitutionSchema = mongoose.Schema({
    institutionName: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        required: isLogoRequired
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
        ref: 'Category',      //    Nursery   Kindergarten   ChildrenClub   NurserySchool
        required: true
    },
    foundationEmitter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'

    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'

    },
    animators: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }]
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

function isLogoRequired() {
    return typeof this.logo === 'string' ? false : true;
}

function isOptionalPhoneNumberRequired() {
    return typeof this.phoneNumbers.mobilePhoneNumber.optionalPhoneNumber === 'string' ? false : true;
}


module.exports = mongoose.model('ChildhoodInstitution', ChildhoodInstitutionSchema);