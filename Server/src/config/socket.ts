import { Server } from "socket.io";
import http from "http";
import express from "express";
import app from "./app.js";
import { User } from "../models/userModel.js";
import { Call } from "../models/callModel.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

const userSocketMap: Record<string, string> = {}; // {userId: socketId}
const activeCalls: Record<string, { callLogId: string; startTime?: number }> = {}; // {userId: callLogInfo}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId as string;
  if (userId) {
    userSocketMap[userId] = socket.id;
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });
    } catch (err) {
      console.error("Error setting user online status:", err);
    }
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("call-user", async (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", {
        from: userId,
        signal: data.signal,
        type: data.type,
      });
    }

    try {
      const newCall = new Call({
        caller: userId,
        receiver: data.to,
        type: data.type,
        status: "missed",
      });
      await newCall.save();
      activeCalls[userId] = { callLogId: newCall._id.toString() };

      // Emit populated call log to both participants
      const populated = await Call.findById(newCall._id)
        .populate("caller", "username profilePic")
        .populate("receiver", "username profilePic");
      const callerSocketId = getReceiverSocketId(userId);
      if (callerSocketId) io.to(callerSocketId).emit("callLogUpdated", populated);
      if (receiverSocketId) io.to(receiverSocketId).emit("callLogUpdated", populated);
    } catch (err) {
      console.error("Error creating call log:", err);
    }
  });

  socket.on("answer-call", async (data) => {
    const callerSocketId = getReceiverSocketId(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-answered", {
        signal: data.signal,
      });
    }

    try {
      const callerId = data.to;
      const activeCall = activeCalls[callerId];
      if (activeCall) {
        activeCall.startTime = Date.now();
        const updated = await Call.findByIdAndUpdate(
          activeCall.callLogId,
          { status: "answered" },
          { new: true }
        )
          .populate("caller", "username profilePic")
          .populate("receiver", "username profilePic");
        // Map receiver's ID to the call log too so they can both end it
        activeCalls[userId] = activeCall;

        // Emit to both participants
        const callerSocketId = getReceiverSocketId(callerId);
        const receiverSocketId = getReceiverSocketId(userId);
        if (callerSocketId) io.to(callerSocketId).emit("callLogUpdated", updated);
        if (receiverSocketId) io.to(receiverSocketId).emit("callLogUpdated", updated);
      }
    } catch (err) {
      console.error("Error updating call log to answered:", err);
    }
  });

  socket.on("ice-candidate", (data) => {
    const targetSocketId = getReceiverSocketId(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate: data.candidate,
      });
    }
  });

  socket.on("reject-call", async (data) => {
    const callerSocketId = getReceiverSocketId(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
    }

    try {
      const callerId = data.to;
      const activeCall = activeCalls[callerId];
      if (activeCall) {
        const updated = await Call.findByIdAndUpdate(
          activeCall.callLogId,
          { status: "rejected" },
          { new: true }
        )
          .populate("caller", "username profilePic")
          .populate("receiver", "username profilePic");
        delete activeCalls[callerId];

        // Emit to both participants
        const callerSocketId = getReceiverSocketId(callerId);
        const receiverSocketId = getReceiverSocketId(userId);
        if (callerSocketId) io.to(callerSocketId).emit("callLogUpdated", updated);
        if (receiverSocketId) io.to(receiverSocketId).emit("callLogUpdated", updated);
      }
    } catch (err) {
      console.error("Error updating call log to rejected:", err);
    }
  });

  socket.on("end-call", async (data) => {
    const targetSocketId = getReceiverSocketId(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }

    try {
      const partnerId = data.to;
      const activeCall = activeCalls[userId] || activeCalls[partnerId];
      if (activeCall) {
        const duration = activeCall.startTime ? Math.round((Date.now() - activeCall.startTime) / 1000) : 0;
        const updated = await Call.findByIdAndUpdate(
          activeCall.callLogId,
          { duration },
          { new: true }
        )
          .populate("caller", "username profilePic")
          .populate("receiver", "username profilePic");
        delete activeCalls[userId];
        delete activeCalls[partnerId];

        // Emit to both participants
        const userSocketId = getReceiverSocketId(userId);
        const partnerSocketId = getReceiverSocketId(partnerId);
        if (userSocketId) io.to(userSocketId).emit("callLogUpdated", updated);
        if (partnerSocketId) io.to(partnerSocketId).emit("callLogUpdated", updated);
      }
    } catch (err) {
      console.error("Error updating call log duration on end-call:", err);
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      } catch (err) {
        console.error("Error setting user offline status:", err);
      }
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, server };
