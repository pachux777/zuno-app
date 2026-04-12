let socket, peer, localStream;

let coins = parseInt(localStorage.getItem("coins")) || 0;
let history = [];

updateUI();

function login(){
  let name = nameInput.value;
  let age = ageInput.value;

  if(!name || !age) return alert("Fill all");
  if(age < 18) return alert("18+ only");

  loginPage.style.display="none";
  app.style.display="block";

  socket = io();
  setupSocket();
}

function updateUI(){
  coinsEl.innerText = coins;
  localStorage.setItem("coins",coins);
}

function watchAd(){
  coins += 20;
  updateUI();
}

function openPremium(){
  alert("Premium coming soon");
}

function showHistory(){
  alert(history.join("\n") || "No history");
}

function reportUser(){
  if(socket) socket.emit("report");
  alert("Reported");
}

async function startChat(){
  loading.style.display="block";

  localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  localVideo.srcObject = localStream;

  socket.emit("start");
}

function endChat(){
  loading.style.display="none";

  if(peer) peer.close();
  if(socket) socket.disconnect();

  if(localStream){
    localStream.getTracks().forEach(t=>t.stop());
  }
}

function nextUser(){
  if(peer) peer.close();
  socket.emit("next");
}

function setupSocket(){

  socket.on("matched",()=>{
    loading.style.display="none";
    createPeer();
  });

  socket.on("typing",()=>{
    typingDiv.innerText="Stranger typing...";
    setTimeout(()=>typingDiv.innerText="",2000);
  });

  socket.on("message",(d)=>{
    addMessage(d.name+": "+d.text);
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
}

function createPeer(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  localStream.getTracks().forEach(t=>peer.addTrack(t,localStream));

  peer.ontrack=e=>{
    remoteVideo.srcObject = e.streams[0];
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

function typing(){
  if(socket) socket.emit("typing");
}

function sendMsg(){
  let msg = msgInput.value.trim();
  if(msg==="") return;

  socket.emit("message",msg);
  addMessage("You: "+msg);

  msgInput.value="";
}

function addMessage(text){
  let div = document.createElement("div");
  div.innerText = text;
  chatBox.appendChild(div);

  history.push(text);
}
