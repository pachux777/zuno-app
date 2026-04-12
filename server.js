let socket, peer, stream;

let coins = +localStorage.getItem("coins") || 100;
let history = [];

const AD_LINK = "https://www.profitableratecpm.com/xxxxx"; // your link

update();

/* UI */
function update(){
  coinsEl.innerText = coins;
  localStorage.setItem("coins",coins);
}

/* ===== REALISTIC ADS SYSTEM ===== */

let timerInterval;

function openAd(){
  window.open(AD_LINK,"_blank");

  adBox.style.display="block";
  let time = 8;
  timer.innerText = time;
  claimBtn.disabled = true;

  timerInterval = setInterval(()=>{
    time--;
    timer.innerText = time;

    if(time <= 0){
      clearInterval(timerInterval);
      claimBtn.disabled = false;
    }
  },1000);
}

function claimReward(){
  coins += 20;
  update();

  adBox.style.display="none";
}

/* =============================== */

/* CHAT */
async function start(){
  if(coins < 2) return alert("Need coins");

  coins -= 2;
  update();

  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  me.srcObject = stream;

  socket = io();
  setup();

  socket.emit("start");
}

function end(){
  if(peer) peer.close();
  if(socket) socket.disconnect();
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>peerCreate());

  socket.on("message",(d)=>{
    chat.innerHTML += "<div>"+d.name+": "+d.text+"</div>";
  });

  socket.on("signal",async(d)=>{
    if(!peer) peerCreate();

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
function peerCreate(){
  peer = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  stream.getTracks().forEach(t=>peer.addTrack(t,stream));

  peer.ontrack=e=>stranger.srcObject=e.streams[0];

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

/* SEND */
function send(){
  let m = msg.value.trim();
  if(!m) return;

  socket.emit("message",m);
  chat.innerHTML += "<div>You: "+m+"</div>";
  msg.value="";
}

/* EXTRA */
function next(){ if(peer) peer.close(); socket.emit("next"); }
function showHistory(){ alert(chat.innerText); }
function report(){ alert("Reported"); }
function openPremium(){ alert("Premium coming soon"); }
