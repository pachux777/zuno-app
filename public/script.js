let socket, peer, stream;

let coins = +localStorage.getItem("coins") || 0;

/* LOGIN */
function login(){
  let age = document.getElementById("age").value;
  if(age < 18) return alert("18+ only");

  document.getElementById("login").style.display="none";
  document.getElementById("app").style.display="block";

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
    alert("+20 coins");
  },5000);
}

/* PREMIUM */
function openPremium(){
  document.getElementById("premium").style.display="block";
}
function closePremium(){
  document.getElementById("premium").style.display="none";
}
function buy(cost){
  if(coins < cost) return alert("Not enough coins");
  coins -= cost;
  updateCoins();
  alert("Premium activated");
}

/* REPORT */
function openReport(){
  document.getElementById("report").style.display="block";
}
function closeReport(){
  document.getElementById("report").style.display="none";
}
function submitReport(reason){
  alert("Reported: "+reason);
}

/* CHAT */
async function start(){
  if(coins < 2) return alert("Need coins");

  coins -= 2;
  updateCoins();

  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  document.getElementById("me").srcObject = stream;

  socket = io();
  setup();

  socket.emit("start");
}

function end(){
  if(peer) peer.close();
  if(socket) socket.disconnect();
}

function next(){
  if(peer) peer.close();
  socket.emit("next");
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>{
    createPeer();
  });

  socket.on("message",(d)=>{
    addMsg(d.name+": "+d.text);
  });

  socket.on("signal",async(d)=>{
    if(!peer) createPeer();

    if(d.sdp){
      await peer.setRemoteDescription(d.sdp);

      if(d.sdp.type==="offer"){
        let a = await peer.createAnswer();
        await peer.setLocalDescription(a);
        socket.emit("signal",{sdp:peer.localDescription});
      }
    }

    if(d.candidate){
      await peer.addIceCandidate(d.candidate);
    }
  });
}

/* WEBRTC */
function createPeer(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  stream.getTracks().forEach(t=>peer.addTrack(t,stream));

  peer.ontrack=e=>{
    document.getElementById("stranger").srcObject=e.streams[0];
  };

  peer.onicecandidate=e=>{
    if(e.candidate){
      socket.emit("signal",{candidate:e.candidate});
    }
  };

  peer.createOffer().then(o=>{
    peer.setLocalDescription(o);
    socket.emit("signal",{sdp:o});
  });
}

/* MESSAGE */
function send(){
  let input = document.getElementById("msg");
  let m = input.value.trim();

  if(!m) return;

  socket.emit("message",m);
  addMsg("You: "+m);

  input.value="";
}

function addMsg(text){
  let d=document.createElement("div");
  d.innerText=text;
  document.getElementById("chat").appendChild(d);
}

/* HISTORY */
function openHistory(){
  alert(document.getElementById("chat").innerText || "No history");
}
