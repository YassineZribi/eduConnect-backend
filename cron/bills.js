const ChildhoodInstitution = require('../models/ChildhoodInstitution');
const Parent = require('../models/Parent');
const Bill = require('../models/Bill');

function pad_with_zeroes(number, length) {

    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;

}

const generateBillsMonthly = async () => {
    const allChildhoodInst = await ChildhoodInstitution.find({}, '_id');// .toJSON() or .toJson()
    allChildhoodInst.forEach(async childhoodInst => {
        const parents = await Parent.find({ childhoodInstitution: childhoodInst._id, isVerified: true, isVisible: true }, '_id');
        let bills = await Bill.find({ childhoodInstitution: childhoodInst._id }).countDocuments();
        parents.forEach(async parent => {
            // console.log({ bills });
            const plusOne = bills + 1;
            const invoiceNumber = pad_with_zeroes(plusOne, 4); // padWithZeros
            console.log(`childhoodInstID: ${childhoodInst._id} =>  Invoice N°: ${invoiceNumber}`);
            // Create an instance of a Bill
            const bill = new Bill({
                childhoodInstitution: childhoodInst._id,
                parent: parent._id,
                invoiceNumber
            });
            bills += 1;
            await bill.save();
            // console.log('bill', bill);
        });
    });
};

const setPaymentStatusFieldToNotPaid = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const bills = await Bill.updateMany({ paymentStatus: 'Waiting', monthOfCreation: { $lt: currentMonth } }, { paymentStatus: 'Not Paid' });
    console.log(bills);
};

module.exports = {
    generateBillsMonthly,
    setPaymentStatusFieldToNotPaid
};