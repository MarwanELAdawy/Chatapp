//require the express module
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatroute");
const loginRouter = require("./route/loginRoute");

//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = require("socket.io");

const port = process.env.PORT || 3000;

//bodyparser middleware
app.use(bodyParser.json());

//routes
app.use("/chats", chatRouter);
app.use("/login", loginRouter);

//set the express.static middleware
app.use(express.static(__dirname + "/public"));

const socket = io(http);

//database connection
const Chat = require("./models/Chat");
const connect = require("./dbconnect");

socket.on("connection", (socket)=>{
    console.log("user connected");

    socket.on("disconnect", ()=>{
        console.log("user disconnected");
    });
    
    //Someone is typing
    socket.on("typing", data => {
        socket.broadcast.emit("notifyTyping", {
            user: data.user,
            message: data.message
        });
    });

    //when soemone stops typing
    socket.on("stopTyping", () => {
        socket.broadcast.emit("notifyStopTyping");
    });

    socket.on("chat message", (msg)=>{
        console.log("message: " + msg);

        //broadcast message to everyone in port:3000 except yourself.
        socket.broadcast.emit("received", { message: msg });

        //save chat to the database
        connect.then(db => {
            console.log("connected correctly to the server");
            let chatMessage = new Chat({ message: msg, sender: "Anonymous" });

            chatMessage.save();
        });
    });
});

http.listen(port, () => {
    console.log("Running on Port: " + port);
});