let socket;
let peer;
let localStream;

// ===== AD CONTROL =====
const AD_URL = "https://pl29131156.profitablecpmratenetwork.com/8d/99/98/8d99989f643f0ceb74dababf43137ed4.js";

let lastAdTime = 0;

function triggerAd(){
  let now = Date.now();

  if(now - lastAdTime < 30000) return;

  let s = document.createElement("script");
  s.src = AD_URL;
  document.body.appendChild(s);

  lastAdTime = now;
}

// ===== LOGIN =====
function login(){
  let name = document.getElementById("username").value;
  let age = document.getElementById("age").value;

  if(!name || !age) return alert("Fill all fields");
  if(age < 18) return alert("18+ only");

  document.getElementById("loginPage").style.display="none";
  document.getElementById("app").style.display="block";

  socket = io();
  socket.emit("set-name", name);

  setupSocket();
}

// ===== CAMERA =====
async function startCamera(){
  localStream = await navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
  });

  document.getElementById("localVideo").srcObject = localStream;
}

// ===== START =====
function startChat(){
  startCamera();
  socket.emit("start");
  triggerAd();
}

// ===== SOCKET =====
function setupSocket(){

  socket.on("matched", ()=>{
    createPeer();
  });

  socket.on("signal", async (data)=>{
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

  socket.on("message",(data)=>{
    let div = document.createElement("div");
    div.innerText = data.name + ": " + data.text;
    document.getElementById("chatBox").appendChild(div);
  });

  socket.on("partner-disconnected", ()=>{
    if(peer) peer.close();
    document.getElementById("remoteVideo").srcObject = null;
  });
}

// ===== WEBRTC =====
function createPeer(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  localStream.getTracks().forEach(t=>peer.addTrack(t, localStream));

  peer.ontrack = e=>{
    document.getElementById("remoteVideo").srcObject = e.streams[0];
  };

  peer.onicecandidate = e=>{
    if(e.candidate){
      socket.emit("signal",{candidate:e.candidate});
    }
  };

  peer.createOffer().then(o=>{
    peer.setLocalDescription(o);
    socket.emit("signal",{sdp:o});
  });
}

// ===== CHAT =====
function sendMsg(){
  let input = document.getElementById("msgInput");

  socket.emit("message", input.value);

  let div = document.createElement("div");
  div.innerText = "You: " + input.value;
  document.getElementById("chatBox").appendChild(div);

  input.value="";
}

// ===== NEXT =====
function nextUser(){
  if(peer) peer.close();
  socket.emit("next");
  triggerAd();
}

// ===== END (FIXED) =====
function endChat(){
  if(peer){
    peer.close();
    peer = null;
  }

  if(socket){
    socket.disconnect();
    socket = null;
  }

  if(localStream){
    localStream.getTracks().forEach(track => track.stop());
  }

  document.getElementById("localVideo").srcObject = null;
  document.getElementById("remoteVideo").srcObject = null;

  alert("Chat Ended");
}
