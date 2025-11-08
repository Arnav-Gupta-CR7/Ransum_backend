import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

// ✅ Allow only your deployed frontend
app.use(
  cors({
    origin: [
      "https://ransum-frontend.vercel.app", // change this to your actual Vercel domain
      "http://localhost:5173",     // keep for local testing
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      "https://ransum-frontend.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  },
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    socket.partner = partner.id;
    partner.partner = socket.id;

    socket.emit("paired", { partnerId: partner.id });
    partner.emit("paired", { partnerId: socket.id });
    console.log(`Paired ${socket.id} with ${partner.id}`);
  } else {
    waitingUser = socket;
    socket.emit("waiting", "Waiting for a partner...");
  }

  // --- WebRTC signaling ---
  socket.on("offer", (data) => {
  if (socket.partner) {
    console.log(`Offer from ${socket.id} → ${socket.partner}`);
    io.to(socket.partner).emit("offer", data);
  }
});

socket.on("answer", (data) => {
  if (socket.partner) {
    console.log(`Answer from ${socket.id} → ${socket.partner}`);
    io.to(socket.partner).emit("answer", data);
  }
});

socket.on("ice-candidate", (data) => {
  if (socket.partner) {
    io.to(socket.partner).emit("ice-candidate", data);
  }
});

});

// ✅ Render uses a dynamic port
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
