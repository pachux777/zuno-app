let socket, peer, localStream;

let coins = parseInt(localStorage.getItem("coins")) || 0;
updateCoins();

function login(){
  let age = document.getElementById("age").value;
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

// PREMIUM UI
function openPremium(){ premiumUI.style.display="flex"; }
function closePremium(){ premiumUI.style.display="none"; }

function buy(cost,hours){
  if(coins < cost) return alert("Not enough coins");
  coins -= cost;
  updateCoins();
  alert("Premium "+hours+" hours activated");
}

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
    chatBox.innerHTML += "<div>"+d.name+": "+d.text+"</div>";
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

// CHAT
function sendMsg(){
  let msg = msgInput.value;
  if(!msg) return;
  socket.emit("message",msg);
}

// NEXT
function nextUser(){
  if(peer) peer.close();
  socket.emit("next");
}

// END
function endChat(){
  if(peer) peer.close();
  if(socket) socket.disconnect();
  if(localStream){
    localStream.getTracks().forEach(t=>t.stop());
  }
}
