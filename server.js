const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let waitingUsers = [];

io.on("connection", socket => {

  socket.on("start", (data) => {
    socket.gender = data?.gender || "any";

    let index = waitingUsers.findIndex(u =>
      u.gender === "any" || socket.gender === "any" || u.gender === socket.gender
    );

    if (index !== -1) {
      let user = waitingUsers.splice(index, 1)[0];

      socket.partner = user;
      user.partner = socket;

      socket.emit("matched");
      user.emit("matched");
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on("offer", d => socket.partner?.emit("offer", d));
  socket.on("answer", d => socket.partner?.emit("answer", d));
  socket.on("candidate", d => socket.partner?.emit("candidate", d));

  socket.on("message", msg => socket.partner?.emit("message", msg));

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("next");
      socket.partner.partner = null;
      socket.partner = null;
    }
  });

  socket.on("end", () => {
    if (socket.partner) {
      socket.partner.emit("end");
      socket.partner.partner = null;
      socket.partner = null;
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("end");
      socket.partner.partner = null;
    }
  });

});

http.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});