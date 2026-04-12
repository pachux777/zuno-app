const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve frontend
app.use(express.static("public"));

let waiting = [];

function match(socket){
  if(waiting.length > 0){
    const partner = waiting.shift();

    socket.partner = partner;
    partner.partner = socket;

    socket.emit("matched");
    partner.emit("matched");
  } else {
    waiting.push(socket);
  }
}

io.on("connection",(socket)=>{

  socket.on("start",()=>match(socket));

  socket.on("message",(msg)=>{
    if(socket.partner){
      socket.partner.emit("message",{name:"Stranger",text:msg});
    }
  });

  socket.on("next",()=>{
    if(socket.partner){
      socket.partner.partner = null;
      socket.partner.emit("partner-disconnected");
    }
    socket.partner = null;
    match(socket);
  });

  socket.on("disconnect",()=>{
    waiting = waiting.filter(u => u !== socket);
  });

});

// IMPORTANT FIX
const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", ()=>{
  console.log("Server running on port " + PORT);
});
