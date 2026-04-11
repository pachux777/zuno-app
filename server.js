const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUsers = [];

function findMatch(socket) {
  for (let i = 0; i < waitingUsers.length; i++) {
    let user = waitingUsers[i];

    if (
      user !== socket &&
      (user.gender === socket.gender ||
        user.gender === "Any" ||
        socket.gender === "Any")
    ) {
      waitingUsers.splice(i, 1);

      socket.partner = user;
      user.partner = socket;

      socket.emit("matched");
      user.emit("matched");

      return;
    }
  }

  waitingUsers.push(socket);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("start", (gender) => {
    socket.gender = gender;
    findMatch(socket);
  });

  socket.on("signal", (data) => {
    if (socket.partner) {
      socket.partner.emit("signal", data);
    }
  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;
    findMatch(socket);
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    waitingUsers = waitingUsers.filter((u) => u !== socket);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Server running"));