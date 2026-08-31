
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import { server, io } from "./config/socket.js";

const PORT: number = Number(process.env.PORT) || 5000;

let shuttingDown = false;

async function startServer(): Promise<void> {
  try {
    await connectDB();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log("HTTP server closed.");

    try {
      io.close();
      console.log("Socket.IO closed.");

      console.log("Graceful shutdown complete.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown if something hangs
  setTimeout(() => {
    console.error("Forced shutdown after 10 seconds.");
    process.exit(1);
  }, 10000).unref();
}

// Render sends SIGTERM when stopping/restarting the service
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

// Catch unexpected errors
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception:", error);
  void gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled rejection:", reason);
  void gracefulShutdown("unhandledRejection");
});

void startServer();

