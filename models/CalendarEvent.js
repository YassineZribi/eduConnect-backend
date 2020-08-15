const mongoose = require("mongoose");

const CalendarEventSchema = mongoose.Schema({
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChildhoodInstitution",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    }

}, { timestamps: { createdAt: true, updatedAt: false } });




module.exports = mongoose.model("CalendarEvent", CalendarEventSchema);