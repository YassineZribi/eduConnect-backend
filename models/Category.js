const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema({
    categoryName: {      //    Nursery   Kindergarten   ChildrenClub   NurserySchool
        type: String,
        required: true
    },
    image: {
        type: String,
        required: isMyFieldRequired  // use it like this if you want to store empty string in the db as initiation
    },
    description: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

function isMyFieldRequired() {
    return typeof this.image === 'string' ? false : true;
}


module.exports = mongoose.model('Category', CategorySchema);