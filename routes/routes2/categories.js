const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Category = require("../../models/Category");
require("dotenv").config();


// @route   *** GET /categories/test ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("Category route");
});

// @route   *** Post /categories ***
// @desc    *** create category ***
// @access  *** Private ***
router.post("/", async (req, res) => {
    const { categoryName, image, description } = req.body;
    const category = new Category({
        categoryName,
        image,
        description
    });
    try {
        await category.save();
        res.json(category);
    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: "Server error was occured!!!" });
    }

});

// @route   *** GET /categories ***
// @desc    *** get all categories ***
// @access  *** Public ***
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find();
        if (!categories) return res.status(404).json({ errorMsg: "Can not find all categories" });
        res.json(categories);
    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ serverError: "Server error was occured!!!" });
    }

});






module.exports = router;