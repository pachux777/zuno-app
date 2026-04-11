const socket = io();

let localStream;
let peer;

// START (camera only once)
async function startChat() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    document.getElementById("me").srcObject = localStream;
  }

  const gender = document.getElementById("gender").value;
  socket.emit("start", { gender });
}

function createPeer() {
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(t => peer.addTrack(t, localStream));

  peer.ontrack = e => {
    document.getElementById("stranger").srcObject = e.streams[0];
  };

  peer.onicecandidate = e => {
    if (e.candidate) socket.emit("candidate", e.candidate);
  };
}

socket.on("matched", async () => {
  createPeer();

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("offer", offer);
});

socket.on("offer", async offer => {
  createPeer();

  await peer.setRemoteDescription(offer);

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", answer);
});

socket.on("answer", async a => await peer.setRemoteDescription(a));
socket.on("candidate", async c => await peer.addIceCandidate(c));

// 🔥 ONLY DISCONNECT STRANGER
function resetConnectionOnly() {
  if (peer) {
    peer.close();
    peer = null;
  }

  document.getElementById("stranger").srcObject = null;
}

// NEXT (camera stays ON)
function nextUser() {
  socket.emit("next");

  resetConnectionOnly();

  const gender = document.getElementById("gender").value;
  socket.emit("start", { gender });
}

// END (FULL STOP)
function endChat() {
  socket.emit("end");

  if (peer) peer.close();
  peer = null;

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  document.getElementById("me").srcObject = null;
  document.getElementById("stranger").srcObject = null;
}

socket.on("next", resetConnectionOnly);
socket.on("end", resetConnectionOnly);

// CHAT
function sendMsg() {
  let msg = document.getElementById("msg").value;

  socket.emit("message", msg);

  document.getElementById("chat").innerHTML += "<p>🧑 " + msg + "</p>";
}

socket.on("message", msg => {
  document.getElementById("chat").innerHTML += "<p>👤 " + msg + "</p>";
});