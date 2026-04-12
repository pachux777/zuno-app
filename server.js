const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = [];

function match(s){
  if(waiting.length){
    let p = waiting.shift();
    s.partner = p;
    p.partner = s;
    s.emit("matched");
    p.emit("matched");
  } else {
    waiting.push(s);
  }
}

io.on("connection",(s)=>{

  s.on("start",()=>match(s));

  s.on("signal",(d)=>{
    if(s.partner) s.partner.emit("signal",d);
  });

  s.on("message",(m)=>{
    if(s.partner) s.partner.emit("message",{name:"Stranger",text:m});
  });

  s.on("typing",()=>{
    if(s.partner) s.partner.emit("typing");
  });

  s.on("next",()=>{
    if(s.partner){
      s.partner.emit("partner-disconnected");
      s.partner.partner=null;
    }
    s.partner=null;
    match(s);
  });

});

server.listen(process.env.PORT||10000,"0.0.0.0");
