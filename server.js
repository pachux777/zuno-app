const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend
app.use(express.static("public"));

// Store waiting users
let waitingUsers = [];

// 🔍 Match users
function findMatch(socket) {
  for (let i = 0; i < waitingUsers.length; i++) {
    let user = waitingUsers[i];

    if (user !== socket) {
      waitingUsers.splice(i, 1);

      socket.partner = user;
      user.partner = socket;

      socket.emit("matched");
      user.emit("matched");

      console.log("Matched:", socket.id, "<->", user.id);
      return;
    }
  }

  // No match found → add to queue
  waitingUsers.push(socket);
  console.log("Waiting:", socket.id);
}

// 🔌 Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🧑 Set username
  socket.on("set-name", (name) => {
    socket.name = name;
  });

  // ▶ Start chat
  socket.on("start", () => {
    findMatch(socket);
  });

  // 🔁 WebRTC signaling
  socket.on("signal", (data) => {
    if (socket.partner) {
      socket.partner.emit("signal", data);
    }
  });

  // 💬 Chat message
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", {
        name: socket.name || "Stranger",
        text: msg,
      });
    }
  });

  // ⌨ Typing indicator
  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  // ⏭ Next user
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;
    findMatch(socket);
  });

  // ❌ Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    // Remove from waiting list
    waitingUsers = waitingUsers.filter((u) => u !== socket);
  });
});

// 🌐 Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});