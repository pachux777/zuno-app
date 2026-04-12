let socket, peer, localStream;

// coins (frontend only ✅ safe)
let coins = parseInt(localStorage.getItem("coins")) || 0;
updateCoins();

// LOGIN
function login(){
  let name = document.getElementById("name").value;
  let age = document.getElementById("age").value;

  if(!name || !age) return alert("Fill all");
  if(age < 18) return alert("18+ only");

  document.getElementById("loginPage").style.display="none";
  document.getElementById("app").style.display="block";

  socket = io();
  setupSocket();
}

// COINS
function updateCoins(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins",coins);
}

function watchAd(){
  coins += 20;
  updateCoins();
}

// START CHAT
async function startChat(){
  document.getElementById("loading").style.display="block";

  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  document.getElementById("localVideo").srcObject = localStream;

  socket.emit("start");
}

// SOCKET
function setupSocket(){

  socket.on("matched",()=>{
    document.getElementById("loading").style.display="none";
    createPeer();
  });

  socket.on("typing",()=>{
    document.getElementById("typing").innerText="Stranger typing...";
    setTimeout(()=>document.getElementById("typing").innerText="",2000);
  });

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
    let div = document.createElement("div");
    div.innerText = d.name + ": " + d.text;
    document.getElementById("chatBox").appendChild(div);
  });
}

// WEBRTC
function createPeer(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  localStream.getTracks().forEach(t=>peer.addTrack(t,localStream));

  peer.ontrack=e=>{
    document.getElementById("remoteVideo").srcObject = e.streams[0];
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

// TYPING
function typing(){
  if(socket) socket.emit("typing");
}

// SEND MESSAGE (FIXED)
function sendMsg(){
  if(!socket) return;

  let input = document.getElementById("msg");
  let msg = input.value.trim();

  if(msg === "") return;

  socket.emit("message", msg);

  let div = document.createElement("div");
  div.innerText = "You: " + msg;
  document.getElementById("chatBox").appendChild(div);

  input.value = "";
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
