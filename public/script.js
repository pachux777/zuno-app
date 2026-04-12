let socket = null;
let localStream = null;

let coins = parseInt(localStorage.getItem("coins")) || 0;
let history = [];

/* LOGIN */
function login(){
  let age = document.getElementById("age").value;

  if(age < 18) return alert("18+ only");

  document.getElementById("loginPage").style.display="none";
  document.getElementById("app").style.display="block";

  socket = io();
  setupSocket();

  updateCoins();
}

/* COINS */
function updateCoins(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins",coins);
}

/* ADS */
function watchAd(){
  window.open("https://www.profitableratecpm.com/xxxxx","_blank");

  setTimeout(()=>{
    coins += 20;
    updateCoins();
  },5000);
}

/* PREMIUM */
function openPremium(){
  document.getElementById("premiumBox").style.display="block";
}
function closePremium(){
  document.getElementById("premiumBox").style.display="none";
}
function buy(cost){
  if(coins < cost) return alert("Not enough coins");

  coins -= cost;
  updateCoins();
}

/* REPORT */
function openReport(){
  document.getElementById("reportBox").style.display="block";
}
function closeReport(){
  document.getElementById("reportBox").style.display="none";
}
function reportSend(r){
  alert("Reported: "+r);
}

/* HISTORY */
function showHistory(){
  alert(history.join("\n") || "No history");
}

/* CHAT */
async function startChat(){
  if(coins < 2) return alert("Need coins");

  coins -= 2;
  updateCoins();

  document.getElementById("loading").style.display="block";

  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  document.getElementById("localVideo").srcObject = localStream;

  socket.emit("start");
}

function endChat(){
  document.getElementById("loading").style.display="none";

  if(socket) socket.disconnect();
}

/* SOCKET */
function setupSocket(){

  socket.on("matched",()=>{
    document.getElementById("loading").style.display="none";
  });

  socket.on("typing",()=>{
    document.getElementById("typing").innerText="Typing...";
    setTimeout(()=>document.getElementById("typing").innerText="",2000);
  });

  socket.on("message",(d)=>{
    addMessage(d.name+": "+d.text);
  });
}

/* MESSAGE */
function sendMsg(){
  let input = document.getElementById("msg");
  let msg = input.value.trim();

  if(!msg) return;

  socket.emit("message",msg);
  addMessage("You: "+msg);

  input.value="";
}

function addMessage(text){
  let div=document.createElement("div");
  div.innerText=text;
  document.getElementById("chatBox").appendChild(div);

  history.push(text);
}

/* EXTRA */
function typing(){ if(socket) socket.emit("typing"); }
function nextUser(){ if(socket) socket.emit("next"); }
