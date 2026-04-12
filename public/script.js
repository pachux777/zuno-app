let socket = null;
let stream = null;

let coins = parseInt(localStorage.getItem("coins")) || 100;

update();

/* COINS */
function update(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins", coins);
}

/* ADS */
function watchAd(){
  window.open("https://www.profitableratecpm.com/xxxxx","_blank");

  setTimeout(()=>{
    coins += 20;
    update();
  },5000);
}

/* DEVICES */
navigator.mediaDevices.enumerateDevices().then(devices=>{
  devices.forEach(d=>{
    if(d.kind==="videoinput"){
      camera.innerHTML += `<option value="${d.deviceId}">${d.label||"Camera"}</option>`;
    }
    if(d.kind==="audioinput"){
      mic.innerHTML += `<option value="${d.deviceId}">${d.label||"Mic"}</option>`;
    }
  });
});

/* START */
async function start(){

  if(coins < 2) return alert("Need coins");

  coins -= 2;
  update();

  loading.style.display="block";

  stream = await navigator.mediaDevices.getUserMedia({
    video:{deviceId:camera.value},
    audio:{deviceId:mic.value}
  });

  me.srcObject = stream;

  socket = io();

  setup();

  socket.emit("start");
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>{
    loading.style.display="none";
  });

  socket.on("message",(d)=>{
    addMsg(d.name+": "+d.text);
  });

  socket.on("typing",()=>{
    typing.innerText="Typing...";
    setTimeout(()=>typing.innerText="",1500);
  });

  socket.on("partner-disconnected",()=>{
    loading.style.display="block";
  });
}

/* NEXT */
function next(){
  if(socket) socket.emit("next");
}

/* END */
function end(){
  loading.style.display="none";
  if(socket){
    socket.emit("end");
    socket.disconnect();
  }
}

/* SEND */
function send(){
  let m = msg.value.trim();
  if(!m) return;

  socket.emit("message", m);
  addMsg("You: "+m);

  msg.value="";
}

/* CHAT */
function addMsg(text){
  let d=document.createElement("div");
  d.innerText=text;
  chat.appendChild(d);
}

/* REPORT */
function report(){
  alert("User reported (simulation)");
}
