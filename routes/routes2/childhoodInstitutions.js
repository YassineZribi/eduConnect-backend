const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ChildhoodInstitution = require("../../models/ChildhoodInstitution");
require("dotenv").config();


// @route   *** GET /childhoodinstitutions/test ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("childhoodinstitutions route");
});

// @route   *** Post /childhoodinstitutions ***
// @desc    *** create childhood institution ***
// @access  *** Private (only for admin) ***
router.post("/", async (req, res) => {
    const { institutionName, logo, location, phoneNumbers, category, governorate } = req.body;
    const { fixedPhoneNumber, mobilePhoneNumber } = phoneNumbers;
    const { mainPhoneNumber, optionalPhoneNumber } = mobilePhoneNumber;
    const childhoodInstitution = new ChildhoodInstitution({
        institutionName,
        logo,
        governorate,
        location,
        phoneNumbers: {
            fixedPhoneNumber,
            mobilePhoneNumber: {
                mainPhoneNumber,
                optionalPhoneNumber
            }
        },
        category
    });

    try {
        await childhoodInstitution.save();
        res.json(childhoodInstitution);
    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: "Server error was occured!!!" });
    }

});

// @route   *** GET /childhoodinstitutions/one ***
// @desc    *** get one childhood institution  ***
// @access  *** Public ***
router.get("/one", async (req, res) => {
    try {
        const childhoodInstitution = await ChildhoodInstitution.findById("5ec18caa251697483820b5b2"); // .populate('category')
        if (!childhoodInstitution) return res.status(404).json({ errorMsg: "childhood institution NOT FOUND" });
        res.json(childhoodInstitution);
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** GET /childhoodinstitutions ***
// @desc    *** get all childhood institutions  ***
// @access  *** Public ***
router.get("/", async (req, res) => {
    try {
        const childhoodInstitution = await ChildhoodInstitution.find().populate("category"); // .find() may return emty array if the query matchs any documents.
        if (childhoodInstitution.length === 0) return res.status(404).json({ errorMsg: "childhood institution NOT FOUND" });
        res.json(childhoodInstitution);
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});

// @route   *** GET /childhoodinstitutions/bycategory ***
// @desc    *** get all childhood institutions by category  ***
// @access  *** Public ***
router.get("/bycategory", async (req, res) => {
    try {
        const childhoodInstitution = await (await ChildhoodInstitution.find().populate("category")).filter(item => item.category.categoryName === "kindergarten"); // 
        if (childhoodInstitution.length === 0) return res.status(404).json({ errorMsg: "childhood institution NOT FOUND" });
        res.json(childhoodInstitution);
    } catch (err) {
        console.error("error:: ", err.message);
        res.status(500).json({ errorMsg: "server Error" });
    }

});



module.exports = router;