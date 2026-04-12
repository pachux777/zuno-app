let socket;
let peer;
let localStream;

let coins = parseInt(localStorage.getItem("coins")) || 0;
let history = [];

updateUI();

// login
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

// coins
function updateUI(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins", coins);
}

function watchAd(){
  coins += 20;
  updateUI();
}

// history
function showHistory(){
  alert(history.length ? history.join("\n") : "No history");
}

// report
function reportUser(){
  alert("Reported 🚨");
}

// start chat
async function startChat(){
  document.getElementById("loading").style.display="block";

  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  document.getElementById("localVideo").srcObject = localStream;

  socket.emit("start");
}

// socket setup
function setupSocket(){

  socket.on("matched", ()=>{
    document.getElementById("loading").style.display="none";
    createPeer();
  });

  socket.on("typing", ()=>{
    document.getElementById("typing").innerText = "Stranger typing...";
    setTimeout(()=>document.getElementById("typing").innerText="",2000);
  });

  socket.on("message",(data)=>{
    addMessage(data.name + ": " + data.text);
  });

  socket.on("signal", async (data)=>{
    if(!peer) createPeer();

    if(data.sdp){
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

      if(data.sdp.type === "offer"){
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("signal",{sdp:peer.localDescription});
      }
    }

    if(data.candidate){
      await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

}

// peer
function createPeer(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  localStream.getTracks().forEach(track=>{
    peer.addTrack(track, localStream);
  });

  peer.ontrack = (e)=>{
    document.getElementById("remoteVideo").srcObject = e.streams[0];
  };

  peer.onicecandidate = (e)=>{
    if(e.candidate){
      socket.emit("signal",{candidate:e.candidate});
    }
  };

  peer.createOffer().then(offer=>{
    peer.setLocalDescription(offer);
    socket.emit("signal",{sdp:offer});
  });
}

// typing
function typing(){
  if(socket) socket.emit("typing");
}

// send message
function sendMsg(){
  const input = document.getElementById("msg");
  const msg = input.value.trim();

  if(!msg) return;

  socket.emit("message", msg);
  addMessage("You: " + msg);

  input.value = "";
}

// message
function addMessage(text){
  const div = document.createElement("div");
  div.innerText = text;
  document.getElementById("chatBox").appendChild(div);

  history.push(text);
}

// next
function nextUser(){
  if(peer) peer.close();
  socket.emit("next");
}

// end
function endChat(){
  document.getElementById("loading").style.display="none";

  if(peer) peer.close();
  if(socket) socket.disconnect();

  if(localStream){
    localStream.getTracks().forEach(t=>t.stop());
  }
}
