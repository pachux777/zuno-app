let socket;
let peer;
let localStream;
let history = [];

// LOGIN
function login() {
  let name = document.getElementById("username").value;
  let age = document.getElementById("age").value;

  if (!name || !age) {
    alert("Fill all fields");
    return;
  }

  if (age < 18) {
    alert("Only 18+ allowed");
    return;
  }

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("app").style.display = "block";

  socket = io();
  socket.emit("set-name", name);

  setupSocket();
}

// CAMERA
async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("localVideo").srcObject = localStream;
}

// START CHAT
function startChat() {
  startCamera();
  socket.emit("start");
  document.getElementById("status").innerText = "Searching...";
}

// SOCKET
function setupSocket() {

  socket.on("matched", () => {
    document.getElementById("status").innerText = "Connected 🔥";
    createPeer();
  });

  socket.on("signal", async (data) => {
    if (!peer) createPeer();

    if (data.sdp) {
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));

      if (data.sdp.type === "offer") {
        let answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("signal", { sdp: peer.localDescription });
      }
    }

    if (data.candidate) {
      await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

  socket.on("message", (data) => {
    addMessage(data.name + ": " + data.text);
  });

  socket.on("partner-disconnected", () => {
    document.getElementById("status").innerText = "Searching...";
    if (peer) peer.close();
    document.getElementById("remoteVideo").srcObject = null;
  });
}

// WEBRTC
function createPeer() {
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  peer.ontrack = (event) => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { candidate: event.candidate });
    }
  };

  peer.createOffer().then(offer => {
    peer.setLocalDescription(offer);
    socket.emit("signal", { sdp: offer });
  });
}

// CHAT
function sendMsg() {
  let input = document.getElementById("msgInput");

  socket.emit("message", input.value);
  addMessage("You: " + input.value);

  input.value = "";
}

function addMessage(msg) {
  let div = document.createElement("div");
  div.innerText = msg;
  document.getElementById("chatBox").appendChild(div);
  history.push(msg);
}

// HISTORY
function showHistory() {
  alert(history.join("\n") || "No history");
}

// EXTRA FEATURES
function coins() {
  alert("Coins system coming soon");
}

function reportUser() {
  alert("User reported 🚨");
}

function toggleTheatre() {
  document.getElementById("videoBox").classList.toggle("big");
}

// NEXT / END
function nextUser() {
  if (peer) peer.close();
  socket.emit("next");
}

function endChat() {
  if (peer) {
    peer.close();
    peer = null;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  document.getElementById("remoteVideo").srcObject = null;
  document.getElementById("status").innerText = "Ended";
}
