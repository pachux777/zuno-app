let socket;
let peer;
let localStream;
let history=[];

// LOGIN
function login(){
  let name=username.value;
  let age=document.getElementById("age").value;

  if(age<18) return alert("18+ only");

  loginPage.style.display="none";
  app.style.display="block";

  socket=io();
  socket.emit("set-name",name);

  setupSocket();
}

// CAMERA
async function startCamera(){
  localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  localVideo.srcObject=localStream;
}

// START
function startChat(){
  startCamera();
  socket.emit("start");
  status.innerText="Searching...";
}

// SOCKET
function setupSocket(){

  socket.on("matched",()=>{
    status.innerText="Connected";
    createPeer();
  });

  socket.on("signal",async(data)=>{
    if(!peer) createPeer();

    if(data.sdp){
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if(data.sdp.type==="offer"){
        let ans=await peer.createAnswer();
        await peer.setLocalDescription(ans);
        socket.emit("signal",{sdp:peer.localDescription});
      }
    }

    if(data.candidate){
      await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

  socket.on("message",(data)=>{
    addMessage(data.name+": "+data.text);
  });

  socket.on("partner-disconnected",()=>{
    if(peer) peer.close();
    remoteVideo.srcObject=null;
  });
}

// WEBRTC
function createPeer(){
  peer=new RTCPeerConnection({
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
  if(!socket) return;

  let msg=msgInput.value;
  if(!msg) return;

  socket.emit("message",msg);
  addMessage("You: "+msg);

  msgInput.value="";
}

// ADD MESSAGE
function addMessage(msg){
  let d=document.createElement("div");
  d.innerText=msg;
  chatBox.appendChild(d);
  history.push(msg);
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
  if(peer){
    peer.close();
    peer=null;
  }
  if(socket){
    socket.disconnect();
    socket=null;
  }
  if(localStream){
    localStream.getTracks().forEach(t=>t.stop());
  }

  localVideo.srcObject=null;
  remoteVideo.srcObject=null;

  status.innerText="Ended";
}

// EXTRA
function coins(){ alert("Coins coming soon 💰"); }
function reportUser(){ alert("User reported 🚨"); }
function showHistory(){ alert(history.join("\n")||"No history"); }
