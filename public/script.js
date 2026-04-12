let socket, peer, localStream;

let coins = parseInt(localStorage.getItem("coins")) || 100;
let premium = parseInt(localStorage.getItem("premium")) || 0;
let history = [];

const AD_SCRIPT = "https://pl29131156.profitablecpmratenetwork.com/8d/99/98/8d99989f643f0ceb74dababf43137ed4.js";

updateUI();

/* LOGIN */
function login(){
  if(age.value < 18) return alert("18+ only");

  loginPage.style.display="none";
  app.style.display="block";

  socket = io();
  setupSocket();
}

/* UI */
function updateUI(){
  coinsEl.innerText = coins;
  localStorage.setItem("coins",coins);
}

/* ADS FIXED */
function watchAd(){
  let s = document.createElement("script");
  s.src = AD_SCRIPT;
  document.body.appendChild(s);

  setTimeout(()=>{
    coins += 20;
    updateUI();
  },3000);
}

/* AUTO ADS */
setInterval(watchAd,600000);

/* PREMIUM */
function openPremium(){
  let choice = prompt("1=Platinum(200)\n2=Gold(500)\n3=Diamond(1000)");

  if(choice==1 && coins>=200){coins-=200; premium+=7200;}
  if(choice==2 && coins>=500){coins-=500; premium+=36000;}
  if(choice==3 && coins>=1000){coins-=1000; premium+=86400;}

  updateUI();
}

/* CHAT */
async function startChat(){
  if(coins < 2) return alert("Need coins");

  coins -= 2;
  updateUI();

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

/* SOCKET */
function setupSocket(){

  socket.on("matched",()=>{
    loading.style.display="none";
    createPeer();
  });

  socket.on("typing",()=>{
    typing.innerText="Typing...";
    setTimeout(()=>typing.innerText="",2000);
  });

  socket.on("message",(d)=>{
    addMsg(d.name+": "+d.text);
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

/* PEER */
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

/* MESSAGE */
function sendMsg(){
  let msg = document.getElementById("msg").value.trim();
  if(!msg) return;

  socket.emit("message",msg);
  addMsg("You: "+msg);

  msg.value="";
}

function addMsg(text){
  let d=document.createElement("div");
  d.innerText=text;
  chatBox.appendChild(d);
  history.push(text);
}

/* EXTRA */
function typing(){ socket.emit("typing"); }
function nextUser(){ if(peer) peer.close(); socket.emit("next"); }
function showHistory(){ alert(history.join("\n")); }
function reportUser(){ alert("Reported 🚨"); }
