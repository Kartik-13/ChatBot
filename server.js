const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "ChatCord Bot";
//set static folder
app.use(express.static(path.join(__dirname, "public")));

//Runs when clients are connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id,username,room)

    socket.join(user.room)

    //welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord")); //This emit is only for single user conneciting

    //Broadcast when user connects except it self
    socket.broadcast
    .to(user.room)
    .emit(
      "message",
      formatMessage(botName, `${user.username} has joined the chat`)
    );

    // Send user and room info
    io.to(user.room).emit('roomUsers',{
    room: user.room,
    users: getRoomUsers(user.room)
  })
  });

  
  // console.log('New WS connection');   //open bidirectional communication between clients
   //This is for listen message
   socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id)
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
  // Runs when clients are dissconnected
  socket.on("disconnect", () => {

    const user = userLeave(socket.id)

    if (user) {
        io.to(user.room).emit(
            "message", formatMessage(botName, `${user.username} has left the chat`)
            );

        // Send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
      })
    }
  });
  // io.emit()   //This is all clients in general
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
