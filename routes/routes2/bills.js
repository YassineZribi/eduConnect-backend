const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Bill = require("../../models/Bill");
const Parent = require("../../models/Parent");
const TeamMember = require("../../models/TeamMember");
const ChildhoodInstitution = require("../../models/ChildhoodInstitution");
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const checkForHexRegExpFunction = require("../validations/checkMongodbIdValidity");

require("dotenv").config();

function pad_with_zeroes(number, length) {

    var my_string = "" + number;
    while (my_string.length < length) {
        my_string = "0" + my_string;
    }

    return my_string;

}

// @route   *** GET /bills ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("bills route");
});

// @route   *** Post /bills ***
// @desc    *** Create bill ***
// @access  *** Private  ***   mainly with cron but also with manager for parents who are registered during the month
router.post("/:childhoodInstitutionId/:parentId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data and create a bill" });
        // access only for TeamMembers (only for manager)
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.parentId)) return res.status(400).json({ errorMsg: "Can not create a bill for a parent who is not registered in this institution" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const parent = await Parent.findOne({ _id: req.params.parentId, childhoodInstitution });
            if (!parent) return res.status(404).json({ errorMsg: "Can not create a bill for a parent who is not registered in this institution" }); // on peut pas créer une facture pour un parent non inscrit dans cette instituion.

            const bills = await Bill.find({ childhoodInstitution }).countDocuments();
            const plusOne = bills + 1;
            const invoiceNumber = pad_with_zeroes(plusOne, 4);
            // Create an instance of a Bill
            const bill = new Bill({
                childhoodInstitution,
                parent: req.params.parentId,
                invoiceNumber
            });
            await bill.save();
            console.log(bill);
            res.send(bill);
        } else return res.status(403).json({ accessError: "Can not access this data and create a bill (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});




// @route   *** Put /bills ***
// @desc    *** modify bill confirmation to true ***
// @access  *** Private  (only for manager)***
router.put("/confirmation_bill/:childhoodInstitutionId/:billId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data and modify bill confirmation" });
        // access only for TeamMembers (only for manager)
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.billId)) return res.status(400).json({ errorMsg: "Can not find the appropriate Bill to update it" });
            const childhoodInstitution = req.user.childhoodInstitution;
            let bill = await Bill.findOne({ _id: req.params.billId, childhoodInstitution });
            if (!bill) return res.status(404).json({ errorMsg: "Can not find the appropriate Bill to update it" });

            const yearToString = new Date().getFullYear().toString();
            const month = new Date().getMonth() + 1;
            const monthToString = pad_with_zeroes(month, 2);
            const dayToString = new Date().getDate().toString();
            //const allDate = `${dayToString}-${monthToString}-${yearToString}/${pad_with_zeroes(147, 4)}`;
            const allDate = `${dayToString}-${monthToString}-${yearToString}`;
            const { totalAmount } = req.body;
            bill = await Bill.findOneAndUpdate({ _id: req.params.billId, childhoodInstitution }, { $set: { isConfirmed: true, confirmationDate: allDate, paymentStatus: "Has Paid", totalAmount: Number(totalAmount) } }, { new: true });
            res.json(bill);
        } else return res.status(403).json({ accessError: "Can not access this data and modify bill confirmation (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** Put /bills ***
// @desc    *** modify bill paymentStatus to Not Paid*** // with cron 
// @access  *** Private  ***
/*
router.put('/test', async (req, res) => {
    const { billId } = req.body;
    try {

        bill = await Bill.findOneAndUpdate({ _id: billId }, { $set: { paymentStatus: "Not Paid" } }, { new: true });
        if (!bill) return res.status(404).json({ errorMsg: "Can not find the appropriate Bill to update it" });
        res.send(bill);

    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }
});
*/

// @route   *** Put /bills ***
// @desc    *** modify description *** 
// @access  *** Private  (for manager)***
router.put("/modify_desc/:childhoodInstitutionId/:billId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data and modify the bill description" });
        // access only for TeamMembers (only for manager)
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.billId)) return res.status(400).json({ errorMsg: "Can not find the appropriate Bill to update it" });
            const { description } = req.body;
            const childhoodInstitution = req.user.childhoodInstitution;
            const bill = await Bill.findOneAndUpdate({ _id: req.params.billId, childhoodInstitution }, { $set: { description } }, { new: true });
            if (!bill) return res.status(404).json({ errorMsg: "Can not find the appropriate Bill to update it" });
            res.json(bill);
        } else return res.status(403).json({ accessError: "Can not access this data and modify the bill description (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** Put /bills *** (a little bit like delete bill on the front but actually(really) it still exists on db )
// @desc    *** modify isVisible field to false *** 
// @access  *** Private (only for manager) ***
router.put("/isvisible_field_to_false/:childhoodInstitutionId/:billId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data and modify the bill description" });
        // access only for TeamMembers (only for manager)
        if (userToAccess.status.includes("manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.billId)) return res.status(400).json({ errorMsg: "Can not find the appropriate Bill to update it" });
            const childhoodInstitution = req.user.childhoodInstitution;
            const bill = await Bill.findOneAndUpdate({ _id: req.params.billId, childhoodInstitution }, { $set: { isVisible: false } }, { new: true });
            if (!bill) return res.status(404).json({ errorMsg: "Can not find the appropriate Bill to update it" });
            res.json(bill);
        } else return res.status(403).json({ accessError: "Can not access this data and modify the bill description (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

// @route   *** GET /bills ***
// @desc    *** Get all Bills by childhoodInstitution & month ***
// @access  *** Private for all TeamMembers ***
router.get("/monthlybills/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (manager and foundationEmitter)
        if ((userToAccess.status.includes("manager") || userToAccess.status.includes("foundationEmitter")) && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const { monthNum } = req.body;
            const monthlyBills = await Bill.find({ childhoodInstitution, monthOfCreation: Number(monthNum), isVisible: true }, "-__v").populate("parent", ["accountName", "children"]);
            if (monthlyBills.length === 0) return res.status(404).json({ errorMsg: "there are no bills to show in this month at the moment " });
            res.json(monthlyBills);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });

    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});


// @route   *** GET /bills ***
// @desc    *** Get all Bills by childhoodInstitution, paymentStatus & month ***
// @access  *** Private for all TeamMembers ***
router.get("/monthlybills_withstatus/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ accessError: "Can not access this data" });
        // access only for TeamMembers (manager and foundationEmitter)
        if ((userToAccess.status.includes("manager") || userToAccess.status.includes("foundationEmitter")) && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const { monthNum, paymentStatus } = req.body; // paymentStatus: 'Has Paid' / 'Waiting' / 'Not Paid';
            const monthlyBillsWithStatus = await Bill.find({ childhoodInstitution, monthOfCreation: Number(monthNum), paymentStatus, isVisible: true }, "-__v").populate("parent", ["accountName", "children"]);
            if (monthlyBillsWithStatus.length === 0) return res.status(404).json({ errorMsg: `there are no bills with the status ${paymentStatus} to show in this month at the moment` });
            res.json(monthlyBillsWithStatus);
        } else return res.status(403).json({ accessError: "Can not access this data (handle access)" });


    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }
});

/*
// @route   *** GET /childhoodinstitutions/one ***
// @desc    *** get one childhood institution  ***
// @access  *** Public ***
router.get('/one', async (req, res) => {
    try {
        const childhoodInstitution = await ChildhoodInstitution.findById("5ec18caa251697483820b5b2"); // .populate('category')
        if (!childhoodInstitution) return res.status(404).json({ errorMsg: "childhood institution NOT FOUND" });
        res.json(childhoodInstitution);
    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }

});

// @route   *** GET /childhoodinstitutions ***
// @desc    *** get all childhood institutions  ***
// @access  *** Public ***
router.get('/', async (req, res) => {
    try {
        const childhoodInstitution = await ChildhoodInstitution.find().populate('category'); // .find() may return emty array if the query matchs any documents.
        if (childhoodInstitution.length === 0) return res.status(404).json({ errorMsg: "childhood institution NOT FOUND" });
        res.json(childhoodInstitution);
    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }

});

// @route   *** GET /childhoodinstitutions/bycategory ***
// @desc    *** get all childhood institutions by category  ***
// @access  *** Public ***
router.get('/bycategory', async (req, res) => {
    try {
        const childhoodInstitution = await (await ChildhoodInstitution.find().populate('category')).filter(item => item.category.categoryName === 'Kindergarten'); // 
        if (childhoodInstitution.length === 0) return res.status(404).json({ errorMsg: "childhood institution NOT FOUND" });
        res.json(childhoodInstitution);
    } catch (err) {
        console.error('error:: ', err.message);
        res.status(500).json({ errorMsg: 'server Error' });
    }

});

*/

module.exports = router;