const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const ChilhoodInstitution = require("./models/ChildhoodInstitution");
const cors = require("cors");
app.use(cors());
require("./cron/index");


// setup socket.io in the back-end (only 2 lines)
const server = require("http").createServer(app);
const io = require("socket.io")(server);



let connect;
// new ChilhoodInstitution({
//   location: "fqsfqsfqs"
// }).save()


// That line allows us to get the data sended in req.body
app.use(express.json({ extended: false }));

// access routes in other files 
// we want requests url which starts with '/****/***' to pertain to that file routes
app.use("/categories", require("./routes/routes2/categories"));
app.use("/childhoodinstitutions", require("./routes/routes2/childhoodInstitutions"));
app.use("/users", require("./routes/routes2/users"));
app.use("/team_members", require("./routes/routes2/teamMembers"));
app.use("/bills", require("./routes/routes2/bills"));
app.use("/auth", require("./routes/routes2/auth"));
app.use("/posts", require("./routes/posts"));
app.use("/calendar_events", require("./routes/routes2/calendarEvents"));
app.use("/chats", require("./routes/routes2/chats"));


app.get("/", (req, res) => {
    console.log("get request success");
    res.send("API Running");
});

const Chat = require("./models/Chat");

io.on("connection", (socket) => {
    console.log("We have a new connection!!!");
    //console.log({ connect });


    socket.on("join", ({ room }, callback) => {
        socket.join(room);
        console.log(`the manager join the room ${room}`);
        callback();
    });




    socket.on("sendMessage", async ({ content, sender, childhoodInstitution, parent, type, time }, callback) => {
        try {
            // first, we are going to put our data into the db
            // await mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });


            let chat = new Chat({
                content,
                sender,
                childhoodInstitution, // childhoodInstitutionId
                parent, // parentId
                type,
                time // nowTime
            });

            chat = await Chat.populate(chat, [{ path: "childhoodInstitution" }, { path: "parent" }]);
            // Ex: comment = await Comment.populate(comment, [{ path: "childhoodInstitution" }, { path: "user", select: "-password" }]);
            await chat.save();
            //return io.emit("message", chat);
            // console.log({ chat });
            return io.to(parent).emit("message", chat); // Important: here io.to(parent) = io.to(room) 


        } catch (error) {
            console.log("errorSocketIo-sendMessageEvent:::", error);
            //res.status(500).json({ success: false, err });
        }

    });

    socket.on("disconnect", () => {
        console.log("User had left!!!");
    });

});




// Connect Server to database + Make Server listenning 
(async () => {
    try {
        connect = await mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
        console.log("mongoDB database connected to the Server...");
        const PORT = process.env.PORT || 8888;
        server.listen(PORT, err => {
            if (err) {
                console.log("Listening error: ", err);
            } else {
                console.log(`Server is running on port ${PORT}`);
            }
        });
    } catch (err) {
        console.error("error message::: ", err.message);
        // Exit process with failure
        process.exit(1);
    }
})();




// setTimeout(() => {
//     console.log({ connect });
// }, 10000);