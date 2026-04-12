const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUsers = [];

function matchUser(socket){
  if(waitingUsers.length > 0){
    const partner = waitingUsers.shift();

    socket.partner = partner;
    partner.partner = socket;

    socket.emit("matched");
    partner.emit("matched");
  } else {
    waitingUsers.push(socket);
  }
}

io.on("connection",(socket)=>{

  socket.on("start",()=>matchUser(socket));

  socket.on("message",(msg)=>{
    if(socket.partner){
      socket.partner.emit("message",{name:"Stranger",text:msg});
    }
  });

  socket.on("typing",()=>{
    if(socket.partner){
      socket.partner.emit("typing");
    }
  });

  socket.on("next",()=>{
    if(socket.partner){
      socket.partner.partner = null;
      socket.partner.emit("partner-disconnected");
    }
    socket.partner = null;
    matchUser(socket);
  });

  socket.on("disconnect",()=>{
    waitingUsers = waitingUsers.filter(u=>u!==socket);
  });

});

const PORT = process.env.PORT || 10000;

server.listen(PORT,"0.0.0.0",()=>{
  console.log("Server running on port " + PORT);
});
