const mongoose = require('mongoose');

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
        type: String
    },
    status: {   // checkbox          FoundationEmitter    manager    animator
        type: [String],
        required: true
    },
    password: {
        type: String,
        required: true
    },
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    avatar: {
        type: String,
        default: 'https://lh4.googleusercontent.com/proxy/Ep36GcwuLJ3MMM4bFTWf0rzoOu7jmPUEtkR2wGGRUQkNAI1X52JJd3OTXsnNktJIjaZtZV_QN-4pwYi1qANfSLkeS_YteDI',

    },
    createdOn: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);