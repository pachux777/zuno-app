const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

/* ===== MATCH SYSTEM ===== */

let waitingQueue = [];

function matchUsers(socket) {
  if (waitingQueue.length > 0) {
    const partner = waitingQueue.shift();

    socket.partner = partner;
    partner.partner = socket;

    socket.emit("matched");
    partner.emit("matched");

    console.log("Matched:", socket.id, partner.id);
  } else {
    waitingQueue.push(socket);
    console.log("Waiting:", socket.id);
  }
}

/* ===== SOCKET ===== */

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("start", () => {
    matchUsers(socket);
  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", {
        name: "Stranger",
        text: msg
      });
    }
  });

  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("partner-disconnected");
    }
    socket.partner = null;
    matchUsers(socket);
  });

  socket.on("end", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }
    socket.partner = null;
  });

  socket.on("disconnect", () => {
    waitingQueue = waitingQueue.filter(u => u !== socket);

    if (socket.partner) {
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    console.log("Disconnected:", socket.id);
  });

});

/* ===== SERVER START ===== */

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
