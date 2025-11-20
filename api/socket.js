// socket.js
let io = null;

function init(server, opts = {}) {
  const { Server } = require("socket.io");

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [];
  const allOrigins = Array.from(new Set([
    `http://localhost`,
    `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
    ...allowedOrigins
  ].filter(Boolean)));

  io = new Server(server, {
    cors: {
      origin: allOrigins,
      methods: ["GET", "POST"],
      credentials: false
    },
    transports: ["websocket", "polling"],
    path: "/socket.io/"
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinEventRoom", (eventId) => {
      socket.join(`event_${eventId}`);
      console.log(`Socket ${socket.id} joined room event_${eventId}`);
    });
    socket.on("leaveEventRoom", (eventId) => {
      socket.leave(`event_${eventId}`);
      console.log(`Socket ${socket.id} left room event_${eventId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized. Call init(server) first.");
  return io;
}

module.exports = { init, getIO };