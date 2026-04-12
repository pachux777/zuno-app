let socket, peer, localStream;
let coins = parseInt(localStorage.getItem("coins")) || 0;
let premiumTime = parseInt(localStorage.getItem("premiumTime")) || 0;
let history = [];

updateCoins();

// LOGIN
function login(){
  let age = ageInput = document.getElementById("age").value;
  if(age < 18) return alert("18+ only");

  loginPage.style.display="none";
  app.style.display="block";

  socket = io();
  setupSocket();
}

// COINS
function updateCoins(){
  coinCount.innerText = coins;
  localStorage.setItem("coins",coins);
}

// WATCH AD
function watchAd(){
  alert("Ad watched +20 coins");
  coins += 20;
  updateCoins();
}

// SHOP
function toggleShop(){
  shop.style.display = shop.style.display==="none"?"block":"none";
}

// BUY PREMIUM
function buyPremium(cost,hours){
  if(coins < cost) return alert("Not enough coins");

  coins -= cost;
  premiumTime += hours*3600;

  localStorage.setItem("premiumTime",premiumTime);
  updateCoins();

  alert("Premium activated "+hours+" hours");
}

// TIMER
setInterval(()=>{
  if(premiumTime>0){
    premiumTime--;
    localStorage.setItem("premiumTime",premiumTime);
  }
},1000);

// CAMERA
async function startChat(){
  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  localVideo.srcObject = localStream;
  socket.emit("start");
}

// SOCKET
function setupSocket(){

  socket.on("matched",()=>createPeer());

  socket.on("signal",async(data)=>{
    if(!peer) createPeer();

    if(data.sdp){
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if(data.sdp.type==="offer"){
        let ans = await peer.createAnswer();
        await peer.setLocalDescription(ans);
        socket.emit("signal",{sdp:peer.localDescription});
      }
    }

    if(data.candidate){
      await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

  socket.on("message",(d)=>{
    addMessage(d.name+": "+d.text);
  });

}

// WEBRTC
function createPeer(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  localStream.getTracks().forEach(t=>peer.addTrack(t,localStream));

  peer.ontrack=e=>remoteVideo.srcObject=e.streams[0];

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

// MESSAGE FIXED
function sendMsg(){
  let msg = msgInput.value;
  if(!msg) return;

  socket.emit("message",msg);
  addMessage("You: "+msg);

  msgInput.value="";
}

function addMessage(m){
  let d=document.createElement("div");
  d.innerText=m;
  chatBox.appendChild(d);
  history.push(m);
}

// NEXT FIXED
function nextUser(){
  if(peer){
    peer.close();
    peer=null;
  }
  socket.emit("next");
}

// END FIXED
function endChat(){
  if(peer) peer.close();
  if(socket) socket.disconnect();
  if(localStream){
    localStream.getTracks().forEach(t=>t.stop());
  }
}

// EXTRA
function reportUser(){ alert("User reported 🚨"); }
function showHistory(){ alert(history.join("\n") || "No history"); }
