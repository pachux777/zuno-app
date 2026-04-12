const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = [];

function matchUser(socket){
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

  console.log("User connected:", socket.id);

  socket.on("start",()=>{
    matchUser(socket);
  });

  socket.on("message",(msg)=>{
    if(socket.partner){
      socket.partner.emit("message",{
        name:"Stranger",
        text:msg
      });
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

  socket.on("end",()=>{
    if(socket.partner){
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }
    socket.partner = null;
  });

  socket.on("disconnect",()=>{
    waiting = waiting.filter(u => u !== socket);

    if(socket.partner){
      socket.partner.emit("partner-disconnected");
      socket.partner.partner = null;
    }

    console.log("User disconnected:", socket.id);
  });

});

const PORT = process.env.PORT || 10000;

server.listen(PORT,"0.0.0.0",()=>{
  console.log("Server running on port", PORT);
});
