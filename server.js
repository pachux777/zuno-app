const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUsers = [];

function match(socket){
  for(let i=0;i<waitingUsers.length;i++){
    let user = waitingUsers[i];

    if(user !== socket){
      waitingUsers.splice(i,1);

      socket.partner = user;
      user.partner = socket;

      socket.emit("matched");
      user.emit("matched");
      return;
    }
  }
  waitingUsers.push(socket);
}

io.on("connection",(socket)=>{

  socket.on("start",()=>match(socket));

  socket.on("signal",(data)=>{
    if(socket.partner){
      socket.partner.emit("signal",data);
    }
  });

  socket.on("message",(msg)=>{
    if(socket.partner){
      socket.partner.emit("message",{name:"Stranger",text:msg});
    }
  });

  socket.on("next",()=>{
    if(socket.partner){
      socket.partner.emit("partner-disconnected");
      socket.partner.partner=null;
    }
    socket.partner=null;
    match(socket);
  });

  socket.on("disconnect",()=>{
    if(socket.partner){
      socket.partner.emit("partner-disconnected");
      socket.partner.partner=null;
    }
    waitingUsers = waitingUsers.filter(u=>u!==socket);
  });

});

const PORT = process.env.PORT || 10000;
server.listen(PORT,()=>console.log("Server running on",PORT));
