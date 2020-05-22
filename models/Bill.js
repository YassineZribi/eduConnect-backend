const mongoose = require('mongoose');

const BillSchema = mongoose.Schema({
    childhoodInstitutuion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChildhoodInstitution',
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'Waiting...'            // Payé(e)       // En attente...   // Non payé(e)
    },                                   // Has Paid      // Waiting...      // Not Paid
    totalAmount: {
        type: Number,
        required: true
    },
    invoiceNumber: {  // La facture doit porter un numéro unique et suivre la numérotation des factures précédemment émises.
        type: Number
    },
    from: {           // Date de création de la facture (à chaque 1er jour d'un nouvel mois)
        type: Date,
        default: new Date
    },                // from et to vont affecter le status (si on arrive à la fin du mois et la facture n'a pas encore payé, => Non payé)
    to: {
        type: Date
    },
    date: {           // Date de confirmation de la facture qui va s'afficher sur le PDF 
        type: Date
    },
    description: {
        type: String
    }


});