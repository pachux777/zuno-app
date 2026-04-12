let socket;
let stream;

let coins = parseInt(localStorage.getItem("coins")) || 100;

update();

/* LOGIN */
function login(){
  let age = document.getElementById("age").value;

  if(age < 18){
    alert("18+ only");
    return;
  }

  document.getElementById("login").style.display="none";
  document.getElementById("app").style.display="block";

  socket = io();
  setup();
}

/* COINS */
function update(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins",coins);
}

/* ADS */
function watchAd(){
  window.open("https://www.profitableratecpm.com/xxxxx");

  setTimeout(()=>{
    coins += 20;
    update();
  },5000);
}

/* START */
async function start(){
  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  document.getElementById("me").srcObject = stream;

  socket.emit("start");
}

/* NEXT */
function next(){
  if(coins < 2){
    alert("Need coins");
    return;
  }

  coins -= 2;
  update();

  socket.emit("next");
}

/* END */
function end(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  socket.emit("end");
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>{
    console.log("Matched");
  });

  socket.on("message",(d)=>{
    addMsg(d.name + ": " + d.text);
  });

  socket.on("partner-disconnected",()=>{
    alert("Stranger left");
  });
}

/* SEND */
function send(){
  let msg = document.getElementById("msg");
  let text = msg.value.trim();

  if(!text) return;

  socket.emit("message",text);
  addMsg("You: " + text);

  msg.value="";
}

/* CHAT */
function addMsg(text){
  let div = document.createElement("div");
  div.innerText = text;
  document.getElementById("chat").appendChild(div);
}

/* REPORT */
function openReport(){
  document.getElementById("reportBox").style.display="block";
}

function reportAction(reason){
  alert("Reported: " + reason);
  document.getElementById("reportBox").style.display="none";
}
