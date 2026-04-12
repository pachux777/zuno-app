let socket;
let coins = localStorage.getItem("coins") || 100;
coins = parseInt(coins);

function updateCoins(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins", coins);
}
updateCoins();

/* LOGIN */
function login(){
  let age = document.getElementById("age").value;
  if(age < 18){
    alert("You must be 18+ to enter.");
    return;
  }

  document.getElementById("login").style.display="none";
  document.getElementById("app").style.display="block";

  socket = io();
  setup();
}

/* TERMS */
function openTerms(){ terms.style.display="block"; }
function closeTerms(){ terms.style.display="none"; }

/* ADS */
function watchAd(){
  window.open("https://www.profitableratecpm.com/xxxxx");
  setTimeout(()=>{
    coins += 20;
    updateCoins();
  },4000);
}

/* PREMIUM */
function openPremium(){ premiumBox.style.display="block"; }

function buy(cost,hours){
  if(coins < cost){
    alert("Not enough coins");
    return;
  }
  coins -= cost;
  updateCoins();
  alert("Premium activated for "+hours+" hours");
}

/* REPORT */
function openReport(){ reportBox.style.display="block"; }

function ban(){
  alert("User banned for 3 days (simulation)");
}

/* HISTORY */
function loadHistory(){
  socket.emit("getHistory");
}

function showHistory(list){
  historyBox.style.display="block";
  historyList.innerHTML="";
  list.forEach(id=>{
    let li=document.createElement("li");
    li.innerText=id;
    historyList.appendChild(li);
  });
}

/* CAMERA */
async function start(){
  let stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  me.srcObject = stream;
  socket.emit("start");
}

function next(){
  if(coins < 2){ alert("Need coins"); return; }
  coins -= 2;
  updateCoins();
  socket.emit("next");
}

function end(){
  socket.emit("end");
}

/* CHAT */
function send(){
  let msg = document.getElementById("msg").value;
  socket.emit("message", msg);
  addMsg("You: "+msg);
}

function addMsg(t){
  let d=document.createElement("div");
  d.innerText=t;
  chat.appendChild(d);
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>{});

  socket.on("message",(m)=>{
    addMsg("Stranger: "+m);
  });

  socket.on("history",(list)=>{
    showHistory(list);
  });

}
