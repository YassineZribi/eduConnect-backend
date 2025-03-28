const mongoose = require("mongoose");
const Parent = require("./Parent");
const ChildhoodInstitution = require("./ChildhoodInstitution");
const Category = require("./Category");

const BillSchema = mongoose.Schema({
    childhoodInstitution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChildhoodInstitution",
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        required: true
    },
    paymentStatus: {
        type: String,
        default: "waiting"             // Payé(e)       // En attente...   // Non payé(e)
    },                                   // has paid      // waiting      // not paid
    totalAmount: {
        type: Number
    },
    invoiceNumber: {  // La facture doit porter un numéro unique et suivre la numérotation des factures précédemment émises.
        type: String,
        required: true
    },
    monthOfCreation: {
        type: Number,
        default: monthNumber
    },
    confirmationDate: {           // Date de confirmation de la facture qui va s'afficher sur le PDF 
        type: String
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ""
    },
    paymentModality: {
        type: String,
        default: ""
    },
    bank: {
        checkNumber: { type: String, default: "" },
        bankName: { type: String, default: "" }
    },
    staticInfos: {
        parent: { type: Parent.schema },
        childhoodInstitution: { type: ChildhoodInstitution.schema },
        childhoodInstCategory: { type: Category.schema }
    }

}, { timestamps: { createdAt: true, updatedAt: false } }); // Date de création de la facture (à chaque n^eme jour d'un nouvel mois)

const MonthSchema = mongoose.Schema({
    monthNumber: {
        type: Number,
        default: monthNumber
    },
    monthName: {
        type: String,
        default: monthName
    }
});

/*
function isDescriptionRequired() {
    return typeof this.description === 'string' ? false : true;
}
*/

function monthNumber() {

    return new Date().getMonth() + 1;

}
function monthName() { // cette fonction n'est pas utilisée ici mais je l'ai laissé car je penses que je vais l'utiliser ultérieurement en front-end
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    return monthNames[new Date().getMonth()];

}


module.exports = mongoose.model("Bill", BillSchema);