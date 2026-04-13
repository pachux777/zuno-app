let socket;
let coins = localStorage.getItem("coins") || 100;
coins = parseInt(coins);

/* 🔥 ADDED */
let localStream;
let peer;

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

  socket = io("https://zuno-app.onrender.com"); // 🔥 CHANGED (your server)
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

  /* 🔥 ADDED */
  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});

  me.srcObject = localStream;

  socket.emit("start");
}

function next(){
  if(coins < 2){ alert("Need coins"); return; }
  coins -= 2;
  updateCoins();

  /* 🔥 ADDED */
  if(peer){ peer.close(); }

  socket.emit("next");
}

function end(){

  /* 🔥 ADDED */
  if(peer){ peer.close(); }

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

/* 🔥 ========================= */
/* 🔥 ADDED WEBRTC SECTION */
/* 🔥 ========================= */

function createPeer(isInitiator){

  peer = new RTCPeerConnection({
    iceServers:[
      {urls:"stun:stun.l.google.com:19302"},
      {
        urls:"turn:openrelay.metered.ca:80",
        username:"openrelayproject",
        credential:"openrelayproject"
      }
    ]
  });

  localStream.getTracks().forEach(track=>{
    peer.addTrack(track, localStream);
  });

  peer.ontrack = e=>{
    stranger.srcObject = e.streams[0];
  };

  peer.onicecandidate = e=>{
    if(e.candidate){
      socket.emit("candidate", e.candidate);
    }
  };

  if(isInitiator){
    peer.createOffer().then(offer=>{
      peer.setLocalDescription(offer);
      socket.emit("offer", offer);
    });
  }
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>{
    /* 🔥 ADDED */
    createPeer(true);
  });

  /* 🔥 ADDED */
  socket.on("offer", async (offer)=>{
    createPeer(false);
    await peer.setRemoteDescription(offer);

    let answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer", answer);
  });

  socket.on("answer", async (answer)=>{
    await peer.setRemoteDescription(answer);
  });

  socket.on("candidate", async (c)=>{
    if(peer){
      await peer.addIceCandidate(c);
    }
  });

  socket.on("end", ()=>{
    if(peer){ peer.close(); }
    stranger.srcObject = null;
  });

  socket.on("message",(m)=>{
    addMsg("Stranger: "+m);
  });

  socket.on("history",(list)=>{
    showHistory(list);
  });

}
