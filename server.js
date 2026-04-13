const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = [];

io.on("connection", (socket) => {

  socket.user = {
    id: socket.id,
    history: []
  };

  function match() {
    if (waiting.length > 0) {
      const partner = waiting.shift();

      socket.partner = partner;
      partner.partner = socket;

      socket.user.history.push(partner.id);
      partner.user.history.push(socket.id);

      socket.emit("matched");
      partner.emit("matched");
    } else {
      waiting.push(socket);
    }
  }

  socket.on("start", match);

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("end");
      socket.partner.partner = null;
    }
    socket.partner = null;
    match();
  });

  socket.on("end", () => {
    if (socket.partner) {
      socket.partner.emit("end");
      socket.partner.partner = null;
    }
    socket.partner = null;
  });

  socket.on("getHistory", () => {
    socket.emit("history", socket.user.history);
  });

  /* 🔥 ========================= */
  /* 🔥 ADDED WEBRTC SIGNALING */
  /* 🔥 ========================= */

  socket.on("offer", (data)=>{
    if(socket.partner){
      socket.partner.emit("offer", data);
    }
  });

  socket.on("answer", (data)=>{
    if(socket.partner){
      socket.partner.emit("answer", data);
    }
  });

  socket.on("candidate", (data)=>{
    if(socket.partner){
      socket.partner.emit("candidate", data);
    }
  });

  /* 🔥 SAFE DISCONNECT FIX (ADDED) */
  socket.on("disconnect", ()=>{
    if (socket.partner) {
      socket.partner.emit("end");
      socket.partner.partner = null;
    }

    waiting = waiting.filter(s => s !== socket);
  });

});

server.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});
