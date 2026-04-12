let socket, peer, localStream;

let coins = parseInt(localStorage.getItem("coins")) || 0;
let premium = parseInt(localStorage.getItem("premium")) || 0;

updateUI();

// LOGIN
function login(){
  let name = document.getElementById("name").value;
  let age = document.getElementById("age").value;

  if(!name || !age) return alert("Fill all");
  if(age < 18) return alert("18+ only");

  loginPage.style.display="none";
  app.style.display="block";

  socket = io();
  setupSocket();
}

// UPDATE UI
function updateUI(){
  coinsEl = document.getElementById("coins");
  timeEl = document.getElementById("premiumTime");

  if(coinsEl) coinsEl.innerText = coins;
  if(timeEl) timeEl.innerText = Math.floor(premium/60)+"m";

  localStorage.setItem("coins",coins);
  localStorage.setItem("premium",premium);
}

// WATCH AD
function watchAd(){
  alert("Ad watched +20 coins");
  coins += 20;
  updateUI();
}

// PREMIUM
function openPremium(){ premiumUI.style.display="flex"; }
function closePremium(){ premiumUI.style.display="none"; }

function buy(cost,hours){
  if(coins < cost) return alert("Not enough coins");

  coins -= cost;
  premium += hours * 3600;

  updateUI();
  alert("Premium activated");
}

// TIMER
setInterval(()=>{
  if(premium > 0){
    premium--;
    updateUI();
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
  let msg = document.getElementById("msg").value;
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
