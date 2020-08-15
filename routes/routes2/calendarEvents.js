const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const CalendarEvent = require("../../models/CalendarEvent");
const TeamMember = require("../../models/TeamMember");
const Parent = require("../../models/Parent");
const authPrivRoutes = require("../../middleware/authPrivRoutes");
const checkForHexRegExpFunction = require("../validations/checkMongodbIdValidity");
require("dotenv").config();


// @route   *** GET /calendar_events ***
// @desc    *** Test route ***
// @access  *** Public ***
router.get("/test", (req, res) => {
    res.send("you are in CalendarEvent route");
});

// @route   *** Post /calendar_events ***
// @desc    *** create calendar event ***
// @access  *** Private ***
router.post("/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ errorMsg: "Can not access this data and create a bill" });
        // access only for TeamMembers (only for manager)
        console.log({ userToAccess: userToAccess.childhoodInstitution, childhoodInstitution: req.params.childhoodInstitutionId });
        if (userToAccess.status.find(obj => obj.value === "manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            const childhoodInstitution = req.user.childhoodInstitution;
            const { text, startTime, endTime } = req.body;
            const calendarEvent = new CalendarEvent({
                childhoodInstitution,
                text,
                startTime,
                endTime
            });

            await calendarEvent.save();
            res.json(calendarEvent);
        } else return res.status(403).json({ errorMsg: "Can not access this data and create a bill (handle access..)" });

    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ errorMsg: "Server error was occured!!!" });
    }

});

// @route   *** Put /calendar_events ***
// @desc    *** update calendar event ***
// @access  *** Private ***
router.put("/:childhoodInstitutionId/:eventId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ errorMsg: "Can not access this data and create a bill" });
        // access only for TeamMembers (only for manager)
        console.log({ userToAccess: userToAccess.childhoodInstitution, childhoodInstitution: req.params.childhoodInstitutionId });
        if (userToAccess.status.find(obj => obj.value === "manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.eventId)) return res.status(400).json({ errorMsg: "Can not find the specific event" });
            const { text } = req.body;
            const event = await CalendarEvent.findById(req.params.eventId);
            if (!event) return res.status(404).json({ errorMsg: "Can not find the specific event" });
            event.text = text;

            await event.save();
            res.json(event);
        } else return res.status(403).json({ errorMsg: "Can not access this data and create a bill (handle access..)" });

    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ errorMsg: "Server error was occured!!!" });
    }

});

// @route   *** GET /calendar_events ***
// @desc    *** get all calendarEvents by childhoodInstituion ***
// @access  *** Public ***

router.get("/:childhoodInstitutionId", authPrivRoutes, async (req, res) => {
    try {
        let userToAccess = await TeamMember.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true }); // .populate("childhoodInstitution", ["institutionName", "logo"])
        if (!userToAccess) {
            userToAccess = await Parent.findOne({ _id: req.user.id, isVisible: true, isAccepted: true, isAllowed: true });
            if (!userToAccess) return res.status(403).json({ errorMsg: "Can not access this data" });

        }
        if (userToAccess.childhoodInstitution.toString() === req.params.childhoodInstitutionId) {                                                              // childhoodInstitution: on peut ajouter ce field avec "user <ici>" mais je trouve que c'est inutile et représente un gaspillage en performance.
            const calendarEvents = await CalendarEvent.find({ childhoodInstitution: req.user.childhoodInstitution });
            res.json(calendarEvents);
        } else return res.status(403).json({ errorMsg: "Can not access this data (handle access)" });

    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ errorMsg: "Server error was occured!!!" });
    }

});

// @route   *** Put /calendar_events ***
// @desc    *** delete calendar event ***
// @access  *** Private ***
router.delete("/:childhoodInstitutionId/:eventId", authPrivRoutes, async (req, res) => {
    try {
        const userToAccess = await TeamMember.findById(req.user.id);
        if (!userToAccess) return res.status(403).json({ errorMsg: "Can not access this data and create a bill" });
        // access only for TeamMembers (only for manager)
        if (userToAccess.status.find(obj => obj.value === "manager") && userToAccess.childhoodInstitution == req.params.childhoodInstitutionId) {
            if (!checkForHexRegExpFunction(req.params.eventId)) return res.status(400).json({ errorMsg: "Can not find the specific event" });

            const event = await CalendarEvent.findByIdAndRemove(req.params.eventId);
            console.log({ event });
            if (!event) return res.status(404).json({ errorMsg: "Can not find the specific event" });


            // await event.save();
            res.json(event);
        } else return res.status(403).json({ errorMsg: "Can not access this data and create a bill (handle access..)" });

    } catch (err) {
        // if something goes wrong (server error or something's wrong with the server)
        console.log("error::", err.message);
        // Le code de réponse HyperText Transfer Protocol (HTTP) d'erreur serveur 500 Internal Server Error indique que le serveur a rencontré un problème inattendu qui l'empêche de répondre à la requête.
        res.status(500).json({ errorMsg: "Server error was occured!!!" });
    }

});




module.exports = router;