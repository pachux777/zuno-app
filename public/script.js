let socket, peer, stream;

let coins = +localStorage.getItem("coins") || 100;
let premium = +localStorage.getItem("premium") || 0;

const AD_LINK = "https://www.profitableratecpm.com/xxxxx"; // replace

update();

/* UI */
function update(){
  document.getElementById("coins").innerText = coins;
  localStorage.setItem("coins",coins);
}

/* ADS FIX (IMPORTANT) */
function watchAd(){
  let w = window.open(AD_LINK,"_blank");

  // give reward after delay
  setTimeout(()=>{
    coins += 20;
    update();
    alert("+20 coins");
  },5000);
}

/* PREMIUM */
function openPremium(){
  document.getElementById("premiumBox").style.display="block";
}

function closePremium(){
  document.getElementById("premiumBox").style.display="none";
}

function buy(cost,time){
  if(coins < cost) return alert("Not enough coins");

  coins -= cost;
  premium += time;
  update();
}

/* CHAT */
async function start(){
  if(coins < 2) return alert("Need coins");

  coins -= 2;
  update();

  loading.style.display="block";

  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  me.srcObject = stream;

  socket = io();
  setup();

  socket.emit("start");
}

function end(){
  loading.style.display="none";
  if(peer) peer.close();
  if(socket) socket.disconnect();
}

/* SOCKET */
function setup(){

  socket.on("matched",()=>{
    loading.style.display="none";
    peerCreate();
  });

  socket.on("message",(d)=>{
    chat.innerHTML += "<div>"+d.name+": "+d.text+"</div>";
  });

  socket.on("signal",async(d)=>{
    if(!peer) peerCreate();

    if(d.sdp){
      await peer.setRemoteDescription(d.sdp);

      if(d.sdp.type=="offer"){
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
function historyShow(){ alert(chat.innerText); }
function report(){ alert("Reported"); }
